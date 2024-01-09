import {
  Controller,
  // Get,
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
import { BaseController } from '../base/base.controller';
import { KbResourceService } from './resource.service';

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
    const bkIns = await this.kbService.findByPk(pk);
    this.check_owner(bkIns, user.id);

    const kbResRoot = this.kbService.getKbRoot(bkIns);
    await this.kbResService.checkDir(kbResRoot);

    const targetPaths = [];
    // save to disk
    for (const file of files) {
      const targetPath = join(kbResRoot, file.originalname);
      targetPaths.push(file.originalname);
      await fs.promises.writeFile(targetPath, file.buffer);
    }

    return targetPaths;
  }
}
