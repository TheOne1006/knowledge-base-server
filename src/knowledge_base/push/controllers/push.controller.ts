import * as path from 'path';
import {
  Controller,
  Sse,
  Post,
  Body,
  UseInterceptors,
  UseGuards,
  // ValidationPipe,
  Param,
  ParseIntPipe,
  SetMetadata,
  MessageEvent,
  Inject,
} from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
import { ApiTags, ApiSecurity, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WhereOptions } from 'sequelize';
import { I18nService } from 'nestjs-i18n';
import { eachLimit } from 'async';
import { Observable, Subscriber } from 'rxjs';

import { SerializerInterceptor } from '../../../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../../../common/decorators';
import { RolesGuard } from '../../../common/auth';
import { ROLE_AUTHENTICATED } from '../../../common/constants';
import { RequestUser } from '../../../common/interfaces';
import {
  PushRunOptionDto,
  PushMapDto,
  PushConfigDto,
  ClearPushResDto,
} from '../dtos';

import { config } from '../../../../config';
import { PushConfigService } from '../services/push-config.service';
import { PushMapService } from '../services/push-map.service';
import { PushLogService } from '../services/push-log.service';
import { PushProcessService } from '../services/push-process.service';
import { KbService } from '../../kb/kb.service';
import { KbFileService } from '../../file/file.service';
import { BaseController } from '../../base/base.controller';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/push`)
@ApiSecurity('api_key')
@ApiTags('push')
@UseInterceptors(SerializerInterceptor)
@Controller('push')
export class PushController extends BaseController {
  constructor(
    private readonly service: PushConfigService,
    private readonly pushMapService: PushMapService,
    private readonly pushLogService: PushLogService,
    private readonly pushProcessService: PushProcessService,
    private readonly kbService: KbService,
    private readonly kbFileService: KbFileService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) protected readonly logger: Logger,
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * 执行推送
   */
  @SetMetadata(METHOD_METADATA, RequestMethod.POST)
  @Sse(':configId/run')
  @ApiParam({
    name: 'configId',
    example: '1',
    description: '配置id',
    type: Number,
    required: true,
  })
  @SerializerClass(PushMapDto)
  async run(
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    configId: number,
    @Body() pushOption: PushRunOptionDto,
    @User() owner: RequestUser,
  ): Promise<Observable<MessageEvent>> {
    const pushConfig = await this.service.findByPk(configId);

    this.check_owner(pushConfig, owner.id);

    const { kbResRoot, files, pushMapDict } = await this._runBefore(
      configId,
      pushOption,
      pushConfig,
      owner,
    );

    const pushFlow = async (subscriber: Subscriber<MessageEvent>) => {
      const fileLen = files.length;
      for (let i = 0; i < fileLen; i++) {
        const kbFile = files[i];

        // 推送文件以及增、更 pushMap
        const remoteId = await this._pushFileAndUpsertPushMap(
          pushOption.pushVersion,
          path.join(kbResRoot, kbFile.filePath),
          pushConfig,
          pushMapDict,
          owner,
          kbFile.id,
        );

        subscriber.next({
          data: {
            remoteId, // 抓取处理连接
            fileId: kbFile.id, // 当前处理的文件id
            finish: false, // 是否结束
            total: files.length,
            index: i,
          },
        });
      }
      // 删除 残留在 pushMap 中的数据
      await this._removeResidualDataFromPushMap(pushMapDict, pushConfig);

      subscriber.next({
        data: {
          remoteId: '', // 抓取处理连接
          fileId: 0, // 当前处理的文件id
          finish: true, // 是否结束
          total: files.length,
          index: files.length,
        },
      });

      subscriber.complete();
    };

    const observable = new Observable<MessageEvent>((subscriber) => {
      subscriber.next({
        data: {
          remoteId: '', // 抓取处理连接
          fileId: 0, // 当前处理的文件id
          finish: false, // 是否结束
          total: files.length,
          index: 0,
        },
      });

      pushFlow(subscriber);
    });
    return observable;
  }

  /**
   * 执行推送前的准备工作
   * @param configId
   * @param pushOption
   * @param pushConfig
   * @param owner
   * @returns
   */
  private async _runBefore(
    configId: number,
    pushOption: PushRunOptionDto,
    pushConfig: PushConfigDto,
    owner: RequestUser,
  ) {
    let pushLog = await this.pushLogService.findLastOne({
      configId,
    });

    // 与上一个推送不一致(或者为空)， 则新创建,
    if (pushLog?.pushVersion !== pushOption.pushVersion) {
      const pushVersionIsExists = await this.pushLogService.findLastOne({
        configId,
        pushVersion: pushOption.pushVersion,
      });

      if (pushVersionIsExists) {
        throw new Error(
          `pushVersion: ${pushOption.pushVersion} is exists, please change pushVersion`,
        );
      }

      pushLog = await this.pushLogService.create(
        {
          configId,
          type: pushConfig.type,
          pushVersion: pushOption.pushVersion,
        },
        pushConfig.kbId,
        owner.id,
      );
    }

    const fileWhere: WhereOptions = {
      ownerId: owner.id,
      kbId: pushConfig.kbId,
    };
    const pushMapWhere: WhereOptions = {
      configId,
      ownerId: owner.id,
      kbId: pushConfig.kbId,
    };
    const [kbIns, files, pushMaps] = await Promise.all([
      this.kbService.findByPk(pushConfig.kbId),
      this.kbFileService.findAll(fileWhere),
      this.pushMapService.findAll(pushMapWhere),
    ]);

    const kbResRoot = this.kbService.getKbRoot(kbIns);

    // 过滤 files 以及 pushMaps

    // 最终版本相同可以忽略
    const ignoreFileIds = pushMaps
      .filter((item) => item.pushVersion == pushOption.pushVersion)
      .map((item) => item.fileId);

    const filterFiles = files.filter(
      (item) => !ignoreFileIds.includes(item.id),
    );

    const filterPushMapDict: { [id: number]: PushMapDto } = {};

    pushMaps
      .filter((item) => !ignoreFileIds.includes(item.fileId))
      .forEach((item) => {
        filterPushMapDict[item.fileId] = item;
      });

    return {
      kbResRoot,
      files: filterFiles,
      pushMapDict: filterPushMapDict,
    };
  }

  /**
   * 删除 残留在 pushMap 中的数据，同时将删除信息 push
   * @param  {{ [fileId: number]: PushMapDto }} pushMapDict
   * @param {PushConfigDto} pushConfig
   */
  private async _removeResidualDataFromPushMap(
    pushMapDict: { [fileId: number]: PushMapDto },
    pushConfig: PushConfigDto,
  ) {
    // pushMapDict 转成 array
    const deleteMaps = [];
    //  遍历 dict
    for (const key in pushMapDict) {
      if (pushMapDict.hasOwnProperty(key)) {
        const element = pushMapDict[key];
        deleteMaps.push(element);
      }
    }

    await eachLimit(deleteMaps, 3, async (item: PushMapDto) => {
      await this.pushProcessService.deleteByFile(item.remoteId, pushConfig);
      await this.pushMapService.removeByPk(item.id);
    });
  }

  /**
   * 推送文件以及增、更 pushMap
   * @param pushVersion
   * @param absFilePath
   * @param pushConfig
   * @param pushMapDict
   * @param owner
   * @param kbFileId
   * @returns
   */
  private async _pushFileAndUpsertPushMap(
    pushVersion: string,
    absFilePath: string,
    pushConfig: PushConfigDto,
    pushMapDict: { [fileId: number]: PushMapDto },
    owner: RequestUser,
    kbFileId: number,
  ): Promise<string> {
    const originRemoteId = pushMapDict[kbFileId]?.remoteId || '';
    const isExists = !!originRemoteId;

    const remoteId = await this.pushProcessService.pushByFile(
      absFilePath,
      pushConfig,
      originRemoteId,
    );

    if (isExists) {
      // 弹出 pushMapDict[kbFileId]
      const originMap = pushMapDict[kbFileId];
      delete pushMapDict[kbFileId];
      // 更新
      await this.pushMapService.updateByPk(originMap.id, {
        pushVersion: pushVersion,
      });
    } else {
      // 新建
      const newMap = {
        configId: pushConfig.id,
        type: pushConfig.type,
        fileId: kbFileId,
        remoteId,
        pushVersion: pushVersion,
      };
      await this.pushMapService.create(newMap, pushConfig.kbId, owner.id);
    }

    return remoteId;
  }

  // 清空推送
  @Post(':configId/clearAll')
  @ApiParam({
    name: 'configId',
    example: '1',
    description: '清空推送',
    type: Number,
    required: true,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async clearAll(
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    configId: number,
    @Body() pushOption: PushRunOptionDto,
    @User() owner: RequestUser,
  ): Promise<ClearPushResDto> {
    const pushConfig = await this.service.findByPk(configId);
    this.check_owner(pushConfig, owner.id);

    // 清理 maps
    const allMaps = await this.pushMapService.findAll({
      configId,
      ownerId: owner.id,
      kbId: pushConfig.kbId,
    });
    const deleteIds = allMaps.map((item) => item.id);

    // 清理所有的 pushProcess
    const allRemoteIds =
      await this.pushProcessService.getAllRemoteIds(pushConfig);

    if (allRemoteIds.length || deleteIds.length) {
      await this.pushLogService.create(
        {
          configId,
          type: pushConfig.type,
          pushVersion: pushOption.pushVersion,
        },
        pushConfig.kbId,
        owner.id,
      );
    } else {
      return {
        message: 'no data need clear',
        deleteRemoteIds: [],
        deleteFailedRemoteIds: [],
      };
    }

    // 清理 maps
    await this.pushMapService.batchDeleteByIds(deleteIds);

    const deleteRemoteIds: string[] = [];
    const deleteFailedRemoteIds: string[] = [];

    // 清理所有的 pushProcess
    await eachLimit(allRemoteIds, 3, async (remoteId: string) => {
      try {
        await this.pushProcessService.deleteByFile(remoteId, pushConfig);
        deleteRemoteIds.push(remoteId);
      } catch (error) {
        this.logger.warn(error.message);
        deleteFailedRemoteIds.push(remoteId);
      }
    });

    return {
      message: 'success',
      deleteRemoteIds,
      deleteFailedRemoteIds,
    };
  }
}
