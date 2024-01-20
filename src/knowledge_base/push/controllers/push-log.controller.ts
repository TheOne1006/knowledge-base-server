import {
  Controller,
  Get,
  UseInterceptors,
  UseGuards,
  // ValidationPipe,
  Query,
  Param,
  ParseIntPipe,
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

import { SerializerInterceptor } from '../../../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../../../common/decorators';
import { RolesGuard } from '../../../common/auth';
import {
  ROLE_AUTHENTICATED,
  ROLE_SUPER_ADMIN,
} from '../../../common/constants';
import { RequestUser } from '../../../common/interfaces';
import { PushLogDto } from '../dtos';

import { config } from '../../../../config';
import { PushLogService } from '../services/push-log.service';
import { BaseController } from '../../base/base.controller';
import { ReqDataCountDto } from '../../base/res-data-count.dto';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/push-logs`)
@ApiSecurity('api_key')
@ApiTags('push-logs')
@UseInterceptors(SerializerInterceptor)
@Controller('push-logs')
export class PushLogController extends BaseController {
  constructor(
    private readonly service: PushLogService,
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
    summary: '推送配置列表',
  })
  @Roles(ROLE_SUPER_ADMIN)
  @SerializerClass(PushLogDto)
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
  ): Promise<PushLogDto[]> {
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
  @SerializerClass(PushLogDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async ownerlist(
    @Query(
      'kbId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    kbId: number,
    @Query(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    configId: number,
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
    @User() owner: RequestUser,
  ): Promise<PushLogDto[]> {
    const where: WhereOptions = {
      ownerId: owner.id,
    };

    const preWhere = {
      configId,
      kbId,
    };

    Object.keys(preWhere).forEach((key) => {
      if (preWhere[key]) {
        where[key] = preWhere[key];
      }
    });

    const list = await this.service.findAll(where, offset, limit);
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
  @SerializerClass(PushLogDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findByPk(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
  ): Promise<PushLogDto> {
    const ins = await this.service.findByPk(pk);
    this.check_owner(ins, user.id);
    return ins;
  }
}
