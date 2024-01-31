import {
  Controller,
  Get,
  UseInterceptors,
  UseGuards,
  // ValidationPipe,
  Query,
  Param,
  ParseIntPipe,
  Header,
  ParseArrayPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiSecurity,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { WhereOptions } from 'sequelize';
import { I18nService } from 'nestjs-i18n';
import type { Response } from 'express';
import { ExpressResponse } from '../../../common/decorators/express-res.decorator';

import { SerializerInterceptor } from '../../../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../../../common/decorators';
import { RolesGuard } from '../../../common/auth';
import {
  ROLE_AUTHENTICATED,
  ROLE_SUPER_ADMIN,
} from '../../../common/constants';
import { RequestUser } from '../../../common/interfaces';
import { PushMapDto } from '../dtos';

import { config } from '../../../../config';
import { PushMapService } from '../services/push-map.service';
import { BaseController } from '../../base/base.controller';
import { ReqDataCountDto } from '../../base/res-data-count.dto';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/push-maps`)
@ApiSecurity('api_key')
@ApiTags('push-maps')
@UseInterceptors(SerializerInterceptor)
@Controller('push-maps')
export class PushMapController extends BaseController {
  constructor(
    private readonly service: PushMapService,
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * 获取所有列表
   */
  @Get('/admin-list')
  @ApiQuery({
    name: 'kbId',
    example: '1',
    description: '知识库id',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'configId',
    example: '1',
    description: '推送配置id',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'ownerId',
    example: '1',
    description: '用户id',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    description: 'offset',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'limit',
    example: 10,
    type: Number,
    required: false,
  })
  @ApiOperation({
    summary: '推送结果列表',
  })
  @Roles(ROLE_SUPER_ADMIN)
  @SerializerClass(PushMapDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async adminlist(
    @Query(
      'ownerId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    ownerId: number,
    @Query(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    configId: number,
    @Query(
      'kbId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    kbId: number,
    @Query(
      'offset',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    offset: number,
    @Query(
      'limit',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    limit: number,
  ): Promise<PushMapDto[]> {
    const where: WhereOptions = {};

    const preWhere = {
      configId,
      kbId,
      ownerId,
    };

    Object.keys(preWhere).forEach((key) => {
      if (preWhere[key]) {
        where[key] = preWhere[key];
      }
    });

    const list = await this.service.findAll(where, offset, limit);
    return list;
  }

  /**
   * 获取owner文件列表
   */
  @Get()
  @Header('Access-Control-Expose-Headers', 'X-Total-Count')
  @ApiOperation({
    summary: '所有者的推送配置列表',
  })
  @ApiQuery({
    name: 'kbId',
    example: '1',
    description: '知识库id',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'configId',
    example: '1',
    description: '推送配置id',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'fileId',
    example: '1',
    description: '文件 id',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'remoteId',
    description: 'remoteId',
    required: false,
  })
  @ApiQuery({
    name: 'type',
    description: 'type',
    required: false,
  })
  @ApiQuery({
    name: 'pushVersion',
    description: 'pushVersion',
    required: false,
  })
  @ApiQuery({
    name: 'pushChecksum',
    description: 'pushChecksum',
    required: false,
  })
  @ApiQuery({
    name: 'id',
    description: 'id',
    required: false,
  })
  @ApiQuery({
    name: 'ids',
    description: '逗号分隔',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: '_sort',
    description: '排序字段',
    required: false,
  })
  @ApiQuery({
    name: '_order',
    description: '排序方式',
    required: false,
  })
  @ApiQuery({
    name: '_end',
    description: '结束索引',
    required: false,
  })
  @ApiQuery({
    name: '_start',
    description: '开始索引',
    required: false,
  })
  @SerializerClass(PushMapDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async ownerlist(
    @ExpressResponse() res: Response,
    @User() owner: RequestUser,
    @Query(
      'kbId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    kbId?: number,
    @Query(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    configId?: number,
    @Query(
      'fileId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    fileId?: number,
    @Query('remoteId') remoteId?: string,
    @Query('type') type?: string,
    @Query('pushVersion') pushVersion?: string,
    @Query('pushChecksum') pushChecksum?: string,
    @Query('id', new ParseIntPipe({ optional: true }))
    id?: number,
    @Query('ids', new ParseArrayPipe({ optional: true }))
    ids?: number[],
    @Query(
      '_start',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    start?: number,
    @Query(
      '_end',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    end?: number,
    @Query('_sort') sort?: string,
    @Query('_order') order?: string,
  ): Promise<PushMapDto[]> {
    const originWhere: WhereOptions = {
      ownerId: owner.id,
    };

    const exactSearch = { kbId, configId, fileId, type, id, pushChecksum };
    const fuzzyMatch = {
      remoteId,
      pushVersion,
    };
    const whereIn = {
      id: ids,
    };

    const where = this.buildSearchWhere(
      originWhere,
      exactSearch,
      fuzzyMatch,
      whereIn,
    );
    const [offset, limit] = this.buildSearchOffsetAndLimit(start, end);
    const searchOrder = this.buildSearchOrder(sort, order);

    const list = await this.service.findAll(where, offset, limit, searchOrder);

    const count = await this.service.count(where);

    res.set('X-Total-Count', `messages ${start}-${end}/${count}`);

    return list;
  }

  @Get('count')
  @ApiQuery({
    name: 'ownerId',
    description: 'ownerId',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'configId',
    example: '1',
    description: '推送配置id',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'kbId',
    example: '1',
    description: '知识库id',
    type: Number,
    required: false,
  })
  @SerializerClass(ReqDataCountDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async count(
    @Query(
      'ownerId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    ownerId: number,
    @Query(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    configId: number,
    @Query(
      'kbId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    kbId: number,
  ): Promise<ReqDataCountDto> {
    const where: WhereOptions = {};

    const preWhere = {
      configId,
      kbId,
      ownerId,
    };

    Object.keys(preWhere).forEach((key) => {
      if (preWhere[key]) {
        where[key] = preWhere[key];
      }
    });

    const count = await this.service.count(where);

    return { count };
  }

  /**
   * 根据 id 查找
   */
  @Get(':id')
  @ApiOperation({
    summary: ' 根据 id 查找配置信息',
  })
  @ApiParam({
    name: 'id',
    example: '1',
    description: 'id',
    type: Number,
  })
  @SerializerClass(PushMapDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findByPk(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
  ): Promise<PushMapDto> {
    const ins = await this.service.findByPk(pk);
    this.check_owner(ins, user.id);
    return ins;
  }
}
