import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UseGuards,
  // ValidationPipe,
  // Query,
  // Put,
  // Delete,
  Param,
  ParseIntPipe,
  ParseBoolPipe,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
  Res,
  // Delete,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiSecurity,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { I18nService } from 'nestjs-i18n';
import type { Response } from 'express';
import * as fs from 'fs';
// import { WhereOptions } from 'sequelize';
import { SerializerInterceptor } from '../../common/interceptors/serializer.interceptor';
import { Roles, User, SerializerClass } from '../../common/decorators';
import { RolesGuard } from '../../common/auth';
import { ROLE_AUTHENTICATED } from '../../common/constants';
import { RequestUser } from '../../common/interfaces';
import { FileNameEncodePipe } from '../pipes/file-name.encode.pipe';

import { config } from '../../../config';
import { KbService } from '../kb/kb.service';
import { KbSiteService } from '../site/site.service';
import { KbFileService } from '../file/file.service';
import { BaseController } from '../base/base.controller';
import { KbResourceService } from './resource.service';
import { ENUM_FILE_SOURCE_TYPES } from '../base/constants';
import { FileStatDto } from '../utils/dtos';
import { KbFileDto } from '../file/dtos';
import { SyncFilesToDBDto, RemoveDiskFiles } from './dtos';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/kbs`)
@ApiSecurity('api_key')
@ApiTags('kbs')
@UseInterceptors(SerializerInterceptor)
@Controller('kbs')
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

  @Post(':id/upload')
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiOperation({
    summary: ' 上传文件到知识库',
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
  @SerializerClass(KbFileDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Param('id', ParseIntPipe) pk: number,
    @UploadedFiles(
      new FileNameEncodePipe(),
      new ParseFilePipe({
        validators: [
          // 20M
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 20 }), // bytes
          // pdf html 图片 word JSON jsonl text md 等格式
          // md mimetype: 'application/octet-stream',
          new FileTypeValidator({
            fileType: /(octet-stream|pdf|html|doc|docx|json|jsonl|txt)$/,
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
    @User() owner: RequestUser,
  ): Promise<KbFileDto[]> {
    const kbIns = await this.kbService.findByPk(pk);
    this.check_owner(kbIns, owner.id);

    const kbUploadResRoot = this.kbService.getKbUploadRoot(kbIns);
    await this.kbResService.checkDir(kbUploadResRoot);

    const targetFiles: KbFileDto[] = [];
    await this.kbResService.checkDir(kbUploadResRoot);
    // save to disk
    for (const file of files) {
      const targetPath = this.kbFileService.getFilePath(
        kbUploadResRoot,
        file.originalname,
      );
      await fs.promises.writeFile(targetPath, file.buffer);
      // save to db
      const kbFileIns = {
        filePath: `/${this.kbService.uploadDirName}/${file.originalname}`,
        fileExt: file.originalname.split('.').pop(),
        sourceType: ENUM_FILE_SOURCE_TYPES.UPLOAD,
      };

      // 如果存在则跳过
      const uploadItem = await this.kbFileService.findOrCreate(
        kbFileIns,
        kbFileIns.filePath,
        kbIns.id,
        owner.id,
      );

      targetFiles.push(uploadItem);
    }

    return targetFiles;
  }

  @Post(':id/removeDiskFiles')
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiOperation({
    summary: '通过文件路径删除文件',
  })
  @SerializerClass(KbFileDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async removeDiskFiles(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
    @Body() pyload: RemoveDiskFiles,
  ): Promise<KbFileDto[]> {
    const kbIns = await this.kbService.findByPk(pk);
    this.check_owner(kbIns, user.id);

    const originFiles = pyload.filePaths;
    const kbResRoot = this.kbService.getKbRoot(kbIns.ownerId, kbIns.id);

    const target: KbFileDto[] = [];

    const files = [];
    const removeDirs = [];

    // 遍历 originFiles 处理文件夹
    for (let i = 0; i < originFiles.length; i++) {
      const originPath = originFiles[i];

      const pathOrFileName = originPath.split('/').pop();
      // 包含 . 的为具体文件
      if (/\./.test(pathOrFileName)) {
        files.push(originPath);
      } else {
        removeDirs.push(this.kbService.safeJoinPath(kbResRoot, originPath));
        // 处理目录
        const subFiles = await this.kbService.getAllFiles(
          kbIns,
          pathOrFileName,
          false,
          kbResRoot,
        );

        for (let j = 0; j < subFiles.length; j++) {
          const subFile = subFiles[j];
          files.push(subFile.path);
        }
      }
    }

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const absFilePath = this.kbFileService.getFilePath(kbResRoot, filePath);
      const isExists = await this.kbService.checkPathExist(absFilePath);

      // 删除 disk
      if (isExists) {
        await this.kbFileService.removeFile(absFilePath);
      }

      // 尝试删除 db
      const kbFileIns = await this.kbFileService.findOne({
        kbId: pk,
        filePath,
        ownerId: user.id,
      });

      if (kbFileIns) {
        const deleteFileIns = await this.kbFileService.removeByPk(kbFileIns.id);
        target.push(deleteFileIns);
      }
    }

    await Promise.all(removeDirs.map((item) => this.kbService.removeDir(item)));

    return target;
  }

  @Get(':id/diskFiles')
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiQuery({
    name: 'subDir',
    example: 'title',
    description: '子目录',
    required: false,
  })
  @ApiQuery({
    name: 'isRecursion',
    example: 'true',
    description: '是否为递归显示',
    type: Boolean,
    required: false,
  })
  @SerializerClass(FileStatDto)
  async diskFiles(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
    @Query('subDir') subDir?: string,
    @Query('isRecursion', ParseBoolPipe) isRecursion?: boolean,
  ): Promise<FileStatDto[]> {
    const kbIns = await this.kbService.findByPk(pk);
    this.check_owner(kbIns, user.id);

    const kbResRoot = this.kbService.getKbRoot(kbIns.ownerId, kbIns.id);
    await this.kbResService.checkDir(kbResRoot);

    const files = await this.kbService.getAllFiles(
      kbIns,
      subDir,
      isRecursion,
      kbResRoot,
    );

    return files;
  }

  @Get(':id/privewFile')
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiQuery({
    name: 'filePath',
    example: 'xxx/xxx',
    description: '文件目录',
    required: true,
  })
  async privewFile(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
    @Res() res: Response,
    @Query('filePath') filePath: string,
  ) {
    const kbIns = await this.kbService.findByPk(pk);
    this.check_owner(kbIns, user.id);

    const kbResRoot = this.kbService.getKbRoot(kbIns.ownerId, kbIns.id);

    const targetFilePath = this.kbFileService.getFilePath(kbResRoot, filePath);

    const isExists = await this.kbService.checkPathExist(targetFilePath);

    if (!isExists) {
      throw new Error('not exist file');
    }
    // const ext = targetFilePath.split('.').pop();
    // res.download(file);
    res.sendFile(targetFilePath);
  }

  /**
   * 文件同步到数据库中
   */
  @Get(':id/syncFilesToDb')
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @SerializerClass(SyncFilesToDBDto)
  async syncFilesToDb(
    @Param('id', ParseIntPipe) pk: number,
    @User() user: RequestUser,
  ): Promise<SyncFilesToDBDto> {
    const kbIns = await this.kbService.findByPk(pk);
    this.check_owner(kbIns, user.id);

    // 获取上传目录下的所有文件
    const kbUploadFiles = await this.kbService.getUploadFiles(kbIns);
    // 找到所有文件的数据
    const allUploadFileDBIns = await this.kbFileService.findAll({
      kbId: kbIns.id,
      ownerId: user.id,
      sourceType: ENUM_FILE_SOURCE_TYPES.UPLOAD,
    });

    // 统计
    const createdAndDeleted: SyncFilesToDBDto[] = [];

    const uploadItem = await this._autoCreateOrDeleteFiles(
      kbUploadFiles,
      allUploadFileDBIns,
      kbIns.id,
      user.id,
      ENUM_FILE_SOURCE_TYPES.UPLOAD,
    );
    createdAndDeleted.push(uploadItem);

    // 获取 目录下的所有文件
    const allSiteIns = await this.kbSiteService.findAll({
      kbId: kbIns.id,
      ownerId: user.id,
    });

    const kbResRoot = this.kbService.getKbRoot(kbIns.ownerId, kbIns.id);

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
        kbId: kbIns.id,
        siteId: siteIns.id,
        ownerId: user.id,
      });

      const itemResult = await this._autoCreateOrDeleteFiles(
        allSiteFiles,
        allFileDBSiteIns,
        kbIns.id,
        user.id,
        ENUM_FILE_SOURCE_TYPES.CRAWLER,
        siteIns.id,
      );

      createdAndDeleted.push(itemResult);
    }

    return {
      // 新增数量
      created: createdAndDeleted.reduce((prev, item) => prev + item.created, 0),
      // 删除数量
      deleted: createdAndDeleted.reduce((prev, item) => prev + item.deleted, 0),
    };
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
  private async _autoCreateOrDeleteFiles(
    diskFiles: FileStatDto[],
    dbFiles: KbFileDto[],
    kbId: number,
    userId: number,
    sourceType: ENUM_FILE_SOURCE_TYPES,
    siteId?: number,
  ): Promise<SyncFilesToDBDto> {
    // kbUploadFiles 中的文件, 在数据库中不存在的
    const newFiles = diskFiles.filter((item) => {
      return !dbFiles.some((dbItem) => dbItem.filePath === item.path);
    });

    if (newFiles.length) {
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
    }

    // 删除数据库中存在, 但是本地不存在的
    const deleteFiles = dbFiles.filter((item) => {
      return !diskFiles.some((dbItem) => dbItem.path === item.filePath);
    });

    await this.kbFileService.batchDeleteByIds(
      deleteFiles.map((item) => item.id),
    );

    return {
      created: newFiles.length,
      deleted: deleteFiles.length,
    };
  }
}
