import {
  Controller,
  Get,
  // Post,
  // Body,
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
} from '@nestjs/swagger';
import { WhereOptions } from 'sequelize';
import { I18nService } from 'nestjs-i18n';

import { SerializerInterceptor } from '../../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../../common/decorators';
import { RolesGuard } from '../../common/auth';
import { ROLE_AUTHENTICATED, ROLE_SUPER_ADMIN } from '../../common/constants';
import { RequestUser } from '../../common/interfaces';
import { KbFileDto } from './dtos';

import { config } from '../../../config';
import { KbFileService } from './file.service';
import { BaseController } from '../base/base.controller';
import { ReqDataCountDto } from '../base/res-data-count.dto';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/kb-file`)
@ApiSecurity('api_key')
@ApiTags('kb-file')
@UseInterceptors(SerializerInterceptor)
@Controller('kb-file')
export class KbFileController extends BaseController {
  constructor(
    private readonly service: KbFileService,
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * 获取所有文件列表
   * todo 分页
   */
  @Get('/admin-list')
  @ApiQuery({
    name: 'kbId',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    description: 'offset',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    description: 'limit',
    example: 10,
    type: Number,
    required: true,
  })
  @ApiOperation({
    summary: '知识库文件列表',
  })
  @Roles(ROLE_SUPER_ADMIN)
  @SerializerClass(KbFileDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async adminlist(
    @Query('kbId', ParseIntPipe) kbId: number,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
  ): Promise<KbFileDto[]> {
    const where: WhereOptions = {};

    if (kbId) {
      where.kbId = kbId;
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
  })
  @ApiQuery({
    name: 'offset',
    description: 'offset',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    description: 'limit',
    example: 10,
    type: Number,
    required: true,
  })
  @SerializerClass(KbFileDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async ownerlist(
    @Param('kbId', ParseIntPipe) kbId: number,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
    @User() owner: RequestUser,
  ): Promise<KbFileDto[]> {
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
    @Query('ownerId', ParseIntPipe) ownerId: number,
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
    summary: ' 根据 id 查找库文件',
  })
  @SerializerClass(KbFileDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findByPk(
    @Query('id') id: number,
    @User() user: RequestUser,
  ): Promise<KbFileDto> {
    const ins = await this.service.findByPk(id);
    await this.check_owner(ins, user.id);
    return ins;
  }
  /**
   * rename
   */

  /**
   * 上传文件
   * todo
   */
  // @Post()
  // @ApiOperation({
  //   summary: '创建新知识库',
  // })
  // @SerializerClass(KbFileDto)
  // async uploadFiles(
  //   @Body() newKbInfos: [],
  //   @User() owner: RequestUser,
  // ): Promise<KbFileDto> {
  // }

  /**
   * 删除知识某个文件
   * todo 同步删除
   */
  @Delete('/:id')
  @ApiOperation({
    summary: '删除知识库',
  })
  @SerializerClass(KbFileDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteByPk(
    @Param('id', ParseIntPipe) pk: number,
    @User() owner: RequestUser,
  ): Promise<KbFileDto> {
    const ins = await this.service.findByPk(pk);
    await this.check_owner(ins, owner.id);
    const deleteIns = await this.service.removeByPk(pk);
    return deleteIns;
  }
}
