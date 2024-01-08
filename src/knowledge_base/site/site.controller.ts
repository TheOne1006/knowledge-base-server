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

import { SerializerInterceptor } from '../../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../../common/decorators';
import { RolesGuard } from '../../common/auth';
import { ROLE_AUTHENTICATED, ROLE_SUPER_ADMIN } from '../../common/constants';
import { RequestUser } from '../../common/interfaces';
import { KbSiteDto, CreateKbSiteDto, UpdateKbSiteDto } from './dtos';

import { config } from '../../../config';
import { KbSiteService } from './site.service';
import { KbService } from '../kb/kb.service';
import { BaseController } from '../base/base.controller';
import { ReqDataCountDto } from '../base/res-data-count.dto';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/kb-site`)
@ApiSecurity('api_key')
@ApiTags('kb-site')
@UseInterceptors(SerializerInterceptor)
@Controller('kb-site')
export class KbSiteController extends BaseController {
  constructor(
    private readonly service: KbSiteService,
    private readonly kbService: KbService,
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * 获取所有文件列表
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
    summary: '知识库网站列表',
  })
  @Roles(ROLE_SUPER_ADMIN)
  @SerializerClass(KbSiteDto)
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
  ): Promise<KbSiteDto[]> {
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
  @ApiOperation({
    summary: '所有者的知识库文件列表',
  })
  @ApiQuery({
    name: 'kbId',
    example: '1',
    description: '知识库id',
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
  @SerializerClass(KbSiteDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async ownerlist(
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
    @User() owner: RequestUser,
  ): Promise<KbSiteDto[]> {
    const where: WhereOptions = {
      ownerId: owner.id,
    };
    if (kbId) {
      where.kbId = kbId;
    }

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
  @ApiOperation({
    summary: ' 根据 id 查找网站信息',
  })
  @ApiParam({
    name: 'id',
    example: '1',
    description: '网站id',
    type: Number,
  })
  @SerializerClass(KbSiteDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findByPk(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
  ): Promise<KbSiteDto> {
    const ins = await this.service.findByPk(pk);
    this.check_owner(ins, user.id);
    return ins;
  }

  /**
   * 创建新 site
   * @param newKbInfos
   * @param owner
   * todo: 校验目录文件
   */
  @Post()
  @ApiOperation({
    summary: '创建新知识库网站',
  })
  @ApiQuery({
    name: 'kbId',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @SerializerClass(KbSiteDto)
  async create(
    @Query('kbId', ParseIntPipe) kbId: number,
    @Body() newKbSite: CreateKbSiteDto,
    @User() owner: RequestUser,
  ): Promise<KbSiteDto> {
    const kb = await this.kbService.findByPk(kbId);
    this.check_owner(kb, owner.id);
    const newSite = await this.service.create(newKbSite, kbId, owner.id);
    return newSite;
  }

  /**
   * 删除知识某个文件
   */
  @Delete('/:id')
  @ApiOperation({
    summary: '删除知识库网站',
  })
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库站点id',
    type: Number,
  })
  @SerializerClass(KbSiteDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteByPk(
    @Param('id', ParseIntPipe) pk: number,
    @User() owner: RequestUser,
  ): Promise<KbSiteDto> {
    const ins = await this.service.findByPk(pk);
    this.check_owner(ins, owner.id);
    const deleteIns = await this.service.removeByPk(pk);
    return deleteIns;
  }

  /**
   * 修改知识库site
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
    description: '知识库站点id',
    type: Number,
  })
  @SerializerClass(KbSiteDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateByPk(
    @Param('id', ParseIntPipe) pk: number,
    @Body() updateKbInfo: UpdateKbSiteDto,
    @User() owner: RequestUser,
  ): Promise<KbSiteDto> {
    const ins = await this.service.findByPk(pk);

    this.check_owner(ins, owner.id);
    const newIns = await this.service.updateByPk(pk, updateKbInfo);

    return newIns;
  }
}
