import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UseGuards,
  // ValidationPipe,
  Query,
  Put,
  Delete,
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
import { I18nService } from 'nestjs-i18n';
import { WhereOptions } from 'sequelize';

import type { Response } from 'express';
import { ExpressResponse } from '../../common/decorators/express-res.decorator';

import { SerializerInterceptor } from '../../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../../common/decorators';
import { RolesGuard } from '../../common/auth';
import { ROLE_AUTHENTICATED, ROLE_SUPER_ADMIN } from '../../common/constants';
import { RequestUser } from '../../common/interfaces';
import { KbDto, CreateKbDto, UpdateKbDto } from './dtos';

import { config } from '../../../config';
import { KbService } from './kb.service';
import { BaseController } from '../base/base.controller';
import { ReqDataCountDto } from '../base/res-data-count.dto';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/kbs`)
@ApiSecurity('api_key')
@ApiTags('kbs')
@UseInterceptors(SerializerInterceptor)
@Controller('kbs')
export class KbController extends BaseController {
  constructor(
    private readonly service: KbService,
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * 获取所有知识库列表
   */
  @Get('/admin-list')
  @ApiOperation({
    summary: '知识库列表',
  })
  @ApiQuery({
    name: 'ownerId',
    description: 'ownerId',
    example: 1,
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
  @Roles(ROLE_SUPER_ADMIN)
  @SerializerClass(KbDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async adminlist(
    @Query(
      'ownerId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    ownerId: number,
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
  ): Promise<KbDto[]> {
    const where: WhereOptions = {};

    if (ownerId) {
      where.ownerId = ownerId;
    }

    const list = await this.service.findAll(where, offset, limit);
    return list;
  }

  @Get()
  @Header('Access-Control-Expose-Headers', 'X-Total-Count')
  @ApiOperation({
    summary: '所有者的知识库列表',
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
  @SerializerClass(KbDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async ownerlist(
    @ExpressResponse() res: Response,
    @User() owner: RequestUser,
    @Query('title') title?: string,
    @Query('desc') desc?: string,
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
  ): Promise<KbDto[]> {
    const originWhere: WhereOptions = {
      ownerId: owner.id,
    };

    const exactSearch = {
      id,
    };
    const fuzzyMatch = {
      title,
      desc,
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
  @SerializerClass(ReqDataCountDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async count(
    @Query(
      'ownerId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    ownerId: number,
  ): Promise<ReqDataCountDto> {
    const where: WhereOptions = {};
    if (ownerId) {
      where.ownerId = ownerId;
    }
    const count = await this.service.count(where);

    return { count };
  }

  /**
   * 根据 id 查找
   */
  @Get(':id')
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiOperation({
    summary: ' 根据 id 查找库',
  })
  @SerializerClass(KbDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findByPk(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
  ): Promise<KbDto> {
    const ins = await this.service.findByPk(pk);
    this.check_owner(ins, user.id);
    return ins;
  }

  /**
   * 创建新知识库
   */
  @Post()
  @ApiOperation({
    summary: '创建新知识库',
  })
  @SerializerClass(KbDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @Body() newKbInfo: CreateKbDto,
    @User() owner: RequestUser,
  ): Promise<KbDto> {
    const kbInfo = await this.service.create(newKbInfo, owner.id);

    const kbRoot = this.service.getKbRoot(kbInfo.ownerId, kbInfo.id);
    await this.service.checkDir(kbRoot);

    return kbInfo;
  }

  /**
   * 修改知识库
   *
   * @param user
   */
  @Put('/:id')
  @ApiOperation({
    summary: '修改知识库',
  })
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @SerializerClass(KbDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateByPk(
    @Param('id', ParseIntPipe) pk: number,
    @Body() updateKbInfo: UpdateKbDto,
    @User() owner: RequestUser,
  ): Promise<KbDto> {
    const ins = await this.service.findByPk(pk);

    this.check_owner(ins, owner.id);
    const newIns = await this.service.updateByPk(pk, updateKbInfo);

    return newIns;
  }

  /**
   * 删除知识库
   */
  @Delete('/:id')
  @ApiOperation({
    summary: '删除知识库',
  })
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @SerializerClass(KbDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteByPk(
    @Param('id', ParseIntPipe) pk: number,
    @User() owner: RequestUser,
  ): Promise<KbDto> {
    const ins = await this.service.findByPk(pk);
    this.check_owner(ins, owner.id);
    const deleteIns = await this.service.removeByPk(pk);
    return deleteIns;
  }
}
