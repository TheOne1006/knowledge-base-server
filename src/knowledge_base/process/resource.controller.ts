import {
  Controller,
  Get,
  Post,
  // Body,
  UseInterceptors,
  UseGuards,
  // ValidationPipe,
  // Query,
  // Put,
  // Delete,
  Param,
  ParseIntPipe,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiSecurity,
  ApiResponse,
  // ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { I18nService } from 'nestjs-i18n';

import * as fs from 'fs';
import { join } from 'path';
// import { WhereOptions } from 'sequelize';
import { SerializerInterceptor } from '../../common/interceptors/serializer.interceptor';
import { Roles, User } from '../../common/decorators';
import { RolesGuard } from '../../common/auth';
import { ROLE_AUTHENTICATED } from '../../common/constants';
import { RequestUser } from '../../common/interfaces';
// import { KbFileDto } from '../file/dtos';

import { config } from '../../../config';
import { KbService } from '../kb/kb.service';
import { KbSiteService } from '../site/site.service';
import { KbFileService } from '../file/file.service';
import { BaseController } from '../base/base.controller';
import { KbResourceService } from './resource.service';
import { ENUM_FILE_SOURCE_TYPES } from '../base/constants';
import { FileStatDto } from '../utils/dtos';
import { KbFileDto } from '../file/dtos';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/kb`)
@ApiSecurity('api_key')
@ApiTags('kb')
@UseInterceptors(SerializerInterceptor)
@Controller('kb')
export class KbResourceController extends BaseController {
  constructor(
    private readonly kbService: KbService,
    private readonly kbSiteService: KbSiteService,
    private readonly kbFileService: KbFileService,
    private readonly kbResService: KbResourceService,
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * 根据 id upload
   * todo: 进度条
   */
  @Post(':id/upload')
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiOperation({
    summary: ' 根据 id 查找库',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Param('id', ParseIntPipe) pk: number,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // 20M
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 20 }), // bytes
          // pdf html 图片 word JSON jsonl text md 等格式
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|pdf|html|doc|docx|json|jsonl|txt|md)$/,
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
    @User() user: RequestUser,
  ): Promise<string[]> {
    const kbIns = await this.kbService.findByPk(pk);
    this.check_owner(kbIns, user.id);

    const kbUploadResRoot = this.kbService.getKbUploadRoot(kbIns);
    await this.kbResService.checkDir(kbUploadResRoot);

    const targetPaths = [];
    // save to disk
    for (const file of files) {
      const targetPath = join(kbUploadResRoot, file.originalname);
      targetPaths.push(file.originalname);
      await fs.promises.writeFile(targetPath, file.buffer);
    }

    return targetPaths;
  }

  /**
   * 文件同步到数据库中
   */
  @Get(':id/syncFilesToDb')
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async syncFilesToDb(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
  ) {
    const kbIns = await this.kbService.findByPk(pk);
    this.check_owner(kbIns, user.id);

    // 获取上传目录下的所有文件
    const kbUploadFiles = await this.kbService.getUploadFiles(kbIns);
    // 找到所有文件的数据
    const allUploadFileDBIns = await this.kbFileService.findAll({
      where: {
        kbId: kbIns.id,
        ownerId: user.id,
        sourceType: ENUM_FILE_SOURCE_TYPES.UPLOAD,
      },
    });

    await this._autoCreateOrDeleteFiles(
      kbUploadFiles,
      allUploadFileDBIns,
      kbIns.id,
      user.id,
      ENUM_FILE_SOURCE_TYPES.UPLOAD,
    );

    // 获取 目录下的所有文件
    const allSiteIns = await this.kbSiteService.findAll({
      where: {
        kbId: kbIns.id,
        ownerId: user.id,
      },
    });

    const kbResRoot = this.kbService.getKbRoot(kbIns);

    // 遍历 allSiteIns 找到所有文件的数据
    for (let i = 0; i < allSiteIns.length; i++) {
      const siteIns = allSiteIns[i];
      const allSiteFiles = await this.kbService.getAllFiles(
        kbIns,
        siteIns.title,
        false,
        kbResRoot,
      );

      const allFileDBSiteIns = await this.kbFileService.findAll({
        where: {
          kbId: kbIns.id,
          siteId: siteIns.id,
          ownerId: user.id,
        },
      });

      await this._autoCreateOrDeleteFiles(
        allSiteFiles,
        allFileDBSiteIns,
        kbIns.id,
        user.id,
        ENUM_FILE_SOURCE_TYPES.CRAWLER,
        siteIns.id,
      );
    }
  }

  /**
   * 根据现有文件创建或者删除
   * @param {FileStatDto[]} diskFiles
   * @param {KbFileDto[]} dbFiles
   * @param {number} kbId
   * @param {number} userId
   * @param {ENUM_FILE_SOURCE_TYPES} sourceType
   * @param {number | undefined} siteId
   */
  async _autoCreateOrDeleteFiles(
    diskFiles: FileStatDto[],
    dbFiles: KbFileDto[],
    kbId: number,
    userId: number,
    sourceType: ENUM_FILE_SOURCE_TYPES,
    siteId?: number,
  ) {
    // kbUploadFiles 中的文件, 在数据库中不存在的
    const newFiles = diskFiles.filter((item) => {
      return !dbFiles.some((dbItem) => dbItem.filePath === item.path);
    });
    await this.kbFileService.batchCreate(
      newFiles.map((item) => ({
        filePath: item.path,
        fileExt: item.path.split('.').pop(),
        siteId,
      })),
      userId,
      kbId,
      sourceType,
    );

    // 删除数据库中存在, 但是本地不存在的
    const deleteFiles = dbFiles.filter((item) => {
      return !diskFiles.some((dbItem) => dbItem.path === item.filePath);
    });
    await this.kbFileService.batchDeleteByIds(
      deleteFiles.map((item) => item.id),
    );
  }
}
