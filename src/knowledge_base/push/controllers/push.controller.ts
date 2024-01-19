import * as path from 'path';
import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UseGuards,
  // ValidationPipe,
  Param,
  ParseIntPipe,
  SetMetadata,
  MessageEvent,
} from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';
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
import { PushRunOptionDto, PushMapDto } from '../dtos';

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
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * 执行推送
   */
  @SetMetadata(METHOD_METADATA, RequestMethod.POST)
  @Post('/:configId/run')
  @ApiParam({
    name: 'configId',
    example: '1',
    description: '配置id',
    type: Number,
    required: true,
  })
  @SerializerClass(PushMapDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
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

    let pushLog = await this.pushLogService.findLastOne({
      configId,
    });

    // 与上一个推送不一致(或者为空)， 则新创建,
    if (pushLog?.pushVersion !== pushOption.pushVersion) {
      // todo pushOption.pushVersion  是否重复
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

    const pushMapDict: { [id: number]: PushMapDto } = {};
    pushMaps.forEach((item) => {
      pushMapDict[item.fileId] = item;
    });

    const kbResRoot = this.kbService.getKbRoot(kbIns);

    // 最终版本相同可以忽略
    const ignoreFileIds = pushMaps
      .filter((item) => item.pushVersion == pushOption.pushVersion)
      .map((item) => item.fileId);

    const pushFlow = async (subscriber: Subscriber<MessageEvent>) => {
      const fileLen = files.length;
      for (let i = 0; i < fileLen; i++) {
        const kbFile = files[i];

        // 跳过可以忽略的文件
        if (ignoreFileIds.includes(kbFile.id)) {
          continue;
        }
        const absFilePath = path.join(kbResRoot, kbFile.filePath);

        const isExists = !!pushMapDict[kbFile.id];

        const originRemoteId = isExists ? pushMapDict[kbFile.id].remoteId : '';

        const remoteId = await this.pushProcessService.pushByFile(
          absFilePath,
          pushConfig,
          originRemoteId,
        );

        if (isExists) {
          // 弹出 pushMapDict[kbFile.id]
          const originMap = pushMapDict[kbFile.id];
          delete pushMapDict[kbFile.id];
          // 更新
          await this.pushMapService.updateByPk(originMap.id, {
            pushVersion: pushOption.pushVersion,
          });
        } else {
          // 新建
          const newMap = {
            configId,
            type: pushConfig.type,
            fileId: kbFile.id,
            remoteId,
            pushVersion: pushOption.pushVersion,
          };
          await this.pushMapService.create(newMap, pushConfig.kbId, owner.id);
        }
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

      // pushMapDict 转成 array
      const deleteMaps = [];
      //  遍历 dict
      for (const key in pushMapDict) {
        if (pushMapDict.hasOwnProperty(key)) {
          const element = pushMapDict[key];
          deleteMaps.push(element);
        }
      }

      // 删除 kb file 不存在的 map
      await eachLimit(deleteMaps, 3, async (item: PushMapDto) => {
        await this.pushProcessService.deleteByFile(item.remoteId, pushConfig);
        await this.pushMapService.removeByPk(item.id);
      });

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
}
