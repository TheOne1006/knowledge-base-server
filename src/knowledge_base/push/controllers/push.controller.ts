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
  SetMetadata,
} from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
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
import { eachLimit } from 'async';
import { Observable, Subscriber } from 'rxjs';

import { SerializerInterceptor } from '../../../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../../../common/decorators';
import { RolesGuard } from '../../../common/auth';
import { ROLE_AUTHENTICATED } from '../../../common/constants';
import { RequestUser } from '../../../common/interfaces';
import { PushRunOptionDto, PushMapDto } from '../dtos';

import { config } from '../../../../config';
import { PushConfigService } from '../services/push-config.service';
import { PushMapService } from '../services/push-map.service';
import { PushLogService } from '../services/push-log.service';
import { KbService } from '../../kb/kb.service';
import { KbFileService } from '../../file/file.service';
import { KbSiteService } from '../../site/site.service';
import { BaseController } from '../../base/base.controller';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/push`)
@ApiSecurity('api_key')
@ApiTags('push')
@UseInterceptors(SerializerInterceptor)
@Controller('push')
export class PushController extends BaseController {
  constructor(
    private readonly service: PushConfigService,
    private readonly pushMapService: PushMapService,
    private readonly pushLogService: PushLogService,
    private readonly kbService: KbService,
    private readonly kbSiteService: KbSiteService,
    private readonly kbFileService: KbFileService,
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * 执行推送
   */
  @SetMetadata(METHOD_METADATA, RequestMethod.POST)
  @Post('/:configId/run')
  @ApiParam({
    name: 'configId',
    example: '1',
    description: '配置id',
    type: Number,
    required: true,
  })
  @SerializerClass(PushMapDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async run(
    @Param(
      'configId',
      new ParseIntPipe({ errorHttpStatusCode: 400, optional: true }),
    )
    configId: number,
    @Body() pushOption: PushRunOptionDto,
    @User() owner: RequestUser,
  ): Promise<Observable<MessageEvent>> {
    const pushConfig = await this.service.findByPk(configId);

    this.check_owner(pushConfig, owner.id);

    const where: WhereOptions = {};

    // const list = await this.service.findAll(where, offset, limit);
    // return list;
    return [];
  }
}
