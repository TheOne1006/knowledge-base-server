import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  UseInterceptors,
  UseGuards,
  // ValidationPipe,
  Query,
  Delete,
  Param,
  ParseIntPipe,
  Header,
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
import {
  PushConfigDto,
  CreatePushConfigDto,
  UpdatePushConfigDto,
} from '../dtos';

import { config } from '../../../../config';
import { PushConfigService } from '../services/push-config.service';
import { KbService } from '../../kb/kb.service';
// import { KbFileService } from '../file/file.service';
import { BaseController } from '../../base/base.controller';
import { ReqDataCountDto } from '../../base/res-data-count.dto';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/push-configs`)
@ApiSecurity('api_key')
@ApiTags('push-configs')
@UseInterceptors(SerializerInterceptor)
@Controller('push-configs')
export class PushConfigController extends BaseController {
  constructor(
    private readonly service: PushConfigService,
    private readonly kbService: KbService,
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * 获取所有配置信息
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
  @SerializerClass(PushConfigDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async adminlist(
    @Query(
      'ownerId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    ownerId: number,
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
  ): Promise<PushConfigDto[]> {
    const where: WhereOptions = {};

    if (kbId) {
      where.kbId = kbId;
    }
    if (ownerId) {
      where.ownerId = ownerId;
    }

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
    name: 'title',
    description: 'title',
    required: false,
  })
  @ApiQuery({
    name: 'desc',
    description: 'desc',
    required: false,
  })
  @ApiQuery({
    name: 'type',
    description: 'type',
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
  @SerializerClass(PushConfigDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async ownerlist(
    @ExpressResponse() res: Response,
    @User() owner: RequestUser,
    @Query(
      'kbId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    kbId?: number,
    @Query('title') title?: string,
    @Query('desc') desc?: string,
    @Query('type') type?: string,
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
  ): Promise<PushConfigDto[]> {
    const originWhere: WhereOptions = {
      ownerId: owner.id,
    };

    const exactSearch = { kbId, type };
    const fuzzyMatch = {
      title,
      desc,
    };

    const where = this.buildSearchWhere(originWhere, exactSearch, fuzzyMatch);
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
      'kbId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    kbId: number,
  ): Promise<ReqDataCountDto> {
    const where: WhereOptions = {};
    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (kbId) {
      where.kbId = kbId;
    }

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
    description: '配置id',
    type: Number,
  })
  @SerializerClass(PushConfigDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findByPk(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
  ): Promise<PushConfigDto> {
    const ins = await this.service.findByPk(pk);
    this.check_owner(ins, user.id);
    return ins;
  }

  /**
   * 创建新 配置信息
   * @param newKbInfos
   * @param owner
   */
  @Post()
  @ApiOperation({
    summary: '创建配置信息',
  })
  @ApiQuery({
    name: 'kbId',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @SerializerClass(PushConfigDto)
  async create(
    @Query('kbId', ParseIntPipe) kbId: number,
    @Body() newObj: CreatePushConfigDto,
    @User() owner: RequestUser,
  ): Promise<PushConfigDto> {
    const kb = await this.kbService.findByPk(kbId);
    this.check_owner(kb, owner.id);
    const newSite = await this.service.create(newObj, kbId, owner.id);
    return newSite;
  }

  /**
   * 修改配置信息
   *
   * @param user
   */
  @Put('/:id')
  @ApiOperation({
    summary: '修改配置信息',
  })
  @ApiParam({
    name: 'id',
    example: '1',
    description: '修改配置信息id',
    type: Number,
  })
  @SerializerClass(PushConfigDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateByPk(
    @Param('id', ParseIntPipe) pk: number,
    @Body() updateInfo: UpdatePushConfigDto,
    @User() owner: RequestUser,
  ): Promise<PushConfigDto> {
    const ins = await this.service.findByPk(pk);

    this.check_owner(ins, owner.id);
    const newIns = await this.service.updateByPk(pk, updateInfo);

    return newIns;
  }

  /**
   * 删除配置信息
   */
  @Delete('/:id')
  @ApiOperation({
    summary: '删除配置信息',
  })
  @ApiParam({
    name: 'id',
    example: '1',
    description: '配置id',
    type: Number,
  })
  @SerializerClass(PushConfigDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteByPk(
    @Param('id', ParseIntPipe) pk: number,
    @User() owner: RequestUser,
  ): Promise<PushConfigDto> {
    const ins = await this.service.findByPk(pk);
    this.check_owner(ins, owner.id);
    const deleteIns = await this.service.removeByPk(pk);
    return deleteIns;
  }
}
