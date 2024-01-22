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
  Header,
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
import type { Response } from 'express';
import { ExpressResponse } from '../../common/decorators/express-res.decorator';

import { SerializerInterceptor } from '../../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../../common/decorators';
import { RolesGuard } from '../../common/auth';
import { ROLE_AUTHENTICATED, ROLE_SUPER_ADMIN } from '../../common/constants';
import { RequestUser } from '../../common/interfaces';
import { KbFileDto } from './dtos';

import { config } from '../../../config';
import { KbFileService } from './file.service';
import { KbService } from '../kb/kb.service';
import { BaseController } from '../base/base.controller';
import { ReqDataCountDto } from '../base/res-data-count.dto';
import {
  FILE_SOURCE_TYPE_UPLOAD,
  // FILE_SOURCE_TYPE_CRAWLER,
} from '../base/constants';

const prefix = config.API_V1;

/**
 *
 * todo: 文件预览、文件入库、独立上传文件、同步删除、文件标注
 */

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/kb-files`)
@ApiSecurity('api_key')
@ApiTags('kb-files')
@UseInterceptors(SerializerInterceptor)
@Controller('kb-files')
export class KbFileController extends BaseController {
  constructor(
    private readonly service: KbFileService,
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
    summary: '知识库文件列表',
  })
  @Roles(ROLE_SUPER_ADMIN)
  @SerializerClass(KbFileDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async adminlist(
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
  @Header('Access-Control-Expose-Headers', 'X-Total-Count')
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
    name: 'siteId',
    example: '1',
    description: '站点id',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'filePath',
    example: '/xxx/x.html',
    description: '文件路径',
    required: false,
  })
  @ApiQuery({
    name: 'fileExt',
    example: 'html',
    description: '后缀',
    required: false,
  })
  @ApiQuery({
    name: 'sourceType',
    example: FILE_SOURCE_TYPE_UPLOAD,
    description: '来源',
    required: false,
  })
  @ApiQuery({
    name: 'sourceUrl',
    example: 'https://xxx',
    description: '来源网址',
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
  @SerializerClass(KbFileDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async ownerlist(
    @ExpressResponse() res: Response,
    @User() owner: RequestUser,
    @Query(
      'kbId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    kbId: number,
    @Query(
      'siteId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    siteId: number,
    @Query('filePath') filePath: string,
    @Query('sourceType') sourceType: string,
    @Query('sourceUrl') sourceUrl: string,
    @Query(
      '_start',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    start: number,
    @Query(
      '_end',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    end: number,
    @Query('_sort') sort?: string,
    @Query('_order') order?: string,
  ): Promise<KbFileDto[]> {
    const originWhere: WhereOptions = {
      ownerId: owner.id,
    };

    const exactSearch = { kbId, siteId, sourceType };
    const fuzzyMatch = {
      filePath,
      sourceUrl,
    };

    const where = this.buildSearchWhere(originWhere, exactSearch, fuzzyMatch);
    const [offset, limit] = this.buildSearchOffsetAndLimit(start, end);
    const [sortAttr, sortBy] = this.buildSearchOrder(sort, order);

    const list = await this.service.findAll(where, offset, limit, [
      sortAttr,
      sortBy,
    ]);

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
    @Param(
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
    summary: ' 根据 id 查找库文件',
  })
  @SerializerClass(KbFileDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findByPk(
    @Param('id', ParseIntPipe) id: number,
    @User() user: RequestUser,
  ): Promise<KbFileDto> {
    const ins = await this.service.findByPk(id);
    this.check_owner(ins, user.id);
    return ins;
  }

  /**
   * 删除知识某个文件
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
    this.check_owner(ins, owner.id);
    const deleteIns = await this.service.removeByPk(pk);

    const kb = await this.kbService.findByPk(ins.kbId);
    const kbRoot = this.kbService.getKbRoot(kb);

    // 文件的绝对路径
    const fileAbsPath = this.service.getFilePath(kbRoot, ins);

    const isExist = await this.service.checkPathExist(fileAbsPath);

    // 校验删除
    if (isExist) {
      await this.service.removeFile(fileAbsPath);
    }

    return deleteIns;
  }
}
