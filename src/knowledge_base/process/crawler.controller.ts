import {
  Controller,
  // Get,
  Sse,
  // Post,
  Body,
  UseInterceptors,
  UseGuards,
  // ValidationPipe,
  // Query,
  Put,
  // Delete,
  Param,
  ParseIntPipe,
  SetMetadata,
  MessageEvent,
  Inject,
} from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
import {
  ApiOperation,
  ApiTags,
  ApiSecurity,
  ApiResponse,
  ApiParam,
  // ApiQuery,
  // ApiBody,
  // ApiConsumes,
} from '@nestjs/swagger';
// import { FilesInterceptor } from '@nestjs/platform-express';
import { eachLimit } from 'async';
import { Observable, Subscriber } from 'rxjs';
import { I18nService } from 'nestjs-i18n';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
// import * as fs from 'fs';
// import { join } from 'path';
// import { WhereOptions } from 'sequelize';
import { SerializerInterceptor } from '../../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../../common/decorators';
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
import { CrawlerService } from './crawler.service';
import { CrawlerDto, CrawlerResultDto } from './dtos';
import { FILE_SOURCE_TYPE_CRAWLER } from '../base/constants';
import { CrawlerUrlsManager } from '../utils/crawler-urls-manager';
// import { SkipInterceptor } from '../../core/interceptors/skip.interceptor';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/kbs`)
@ApiSecurity('api_key')
@ApiTags('kbs')
@UseInterceptors(SerializerInterceptor)
@Controller('kbs')
export class CrawlerController extends BaseController {
  constructor(
    private readonly kbService: KbService,
    private readonly kbSiteService: KbSiteService,
    private readonly kbFileService: KbFileService,
    private readonly crawlerService: CrawlerService,
    private readonly kbResService: KbResourceService,
    protected readonly i18n: I18nService,
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
  ) {
    super(i18n);
  }

  /**
   * crawler 抓取 部分数据
   */
  @SetMetadata(METHOD_METADATA, RequestMethod.POST)
  @Sse(':id/site/:siteId/crawler')
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiParam({
    name: 'siteId',
    example: '1',
    description: '站点',
    type: Number,
  })
  @ApiOperation({
    summary: 'crawler 抓取 数据',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @SerializerClass(CrawlerResultDto)
  async crawler(
    @Param('id', ParseIntPipe) pk: number,
    @Param('siteId', ParseIntPipe) siteId: number,
    @Body() crawlerOption: CrawlerDto,
    @User() user: RequestUser,
  ): Promise<Observable<MessageEvent>> {
    this.logger.info(`==crawler start with site: ${pk}`);
    const [kbIns, kbSiteIns] = await Promise.all([
      this.kbService.findByPk(pk),
      this.kbSiteService.findByPk(siteId),
    ]);
    this.check_owner(kbIns, user.id);
    this.check_owner(kbSiteIns, user.id);

    const logger = this.logger;

    // 获取站点的目录
    const kbResRoot = this.kbService.getKbRoot(kbIns.ownerId, kbIns.id);
    const kbSiteResRoot = this.kbSiteService.getKbSiteRoot(
      kbResRoot,
      kbSiteIns,
    );

    const localAllPaths = await this.kbService.getAllFiles(
      kbIns,
      kbSiteIns.title,
      false,
      kbSiteResRoot,
    );

    const completedPaths = localAllPaths.map((item) => item.path);
    const localPathUrls = this.kbSiteService.convertPathsToUrls(
      kbSiteIns,
      completedPaths,
    );

    // 获取开始的urls
    const fullUrls = this.kbSiteService.getFullStartUrls(kbSiteIns);
    // 长度与 fullUrls 一致
    // const completed = new Array(fullUrls.length).fill(false);

    // 控制并发数
    const concurrency = crawlerOption.concurrency;

    // 最大抓取页面
    const maxConnections = crawlerOption.maxConnections;

    // url 管理
    const urlManager = new CrawlerUrlsManager(
      kbSiteIns.matchPatterns,
      kbSiteIns.ignorePatterns,
      fullUrls,
      maxConnections,
      maxConnections,
      crawlerOption.type,
      localPathUrls,
    );

    const crawlFlow = async (subscriber: Subscriber<MessageEvent>) => {
      // 当 i < maxConnections 或者 i < fullUrls.length 时, 继续抓取
      while (urlManager.hasNextBatch()) {
        // 当前需要抓取的连接
        const urls = urlManager.getNextBatch();

        await eachLimit(urls, concurrency, async (url: string) => {
          let completed = true;
          let retry = 0;
          // 爬取链接 以及下载 html
          try {
            // logger start
            logger.info(`start at ${url}`);
            const { links, content } =
              await this.crawlerService.crawlLinksAndContent(
                kbSiteIns.engineType,
                url,
                crawlerOption.linkSelector,
                kbSiteIns.removeSelectors,
                kbSiteIns.evaluate,
              );

            logger.info(`crawlLinksAndContent finish at ${url}`);
            // 加入 urls 队列中
            urlManager.addUrlsFromCrawler(links);
            // 保存 html
            const filePath = await this.kbResService.saveContent(
              kbResRoot,
              kbSiteIns.title,
              url,
              content,
              kbSiteIns.fileSuffix,
            );

            // 入库
            await this.kbFileService.findOrUpdate(
              {
                fileExt: kbSiteIns.fileSuffix,
                sourceType: FILE_SOURCE_TYPE_CRAWLER,
                sourceUrl: url,
              },
              filePath,
              kbIns.id,
              user.id,
              kbSiteIns.id,
            );
            // save html to page
            urlManager.clearRetryUrl(url);
          } catch (error) {
            logger.error(error);
            logger.warn(`error at ${url}, errMsg: ${error.message}`);
            completed = false;
            retry = urlManager.getUrlRetryUrlTimes(url);
            urlManager.addRetryUrl(url);
          }
          const curIndex = urlManager.getUrlIndex(url);
          const total = urlManager.getTotal();

          logger.info(
            `crawler finish at ${url}, completed: ${completed}, ${
              curIndex + 1
            } / ${total}`,
          );

          subscriber.next({
            data: {
              url: url, // 抓取处理连接
              completed, // 是否完成
              retry, // 重试次数
              finish: false, // 是否结束
              total: total,
              index: curIndex + 1,
            },
          });
        });
      }

      this.logger.info(`==crawler all finish with site: ${pk}`);
      // 完成任务
      subscriber.next({
        data: {
          url: '', // 抓取处理连接
          completed: false, // 是否完成
          successUrls: urlManager.getProcessedUrls(),
          failedUrls: urlManager.getFailedUrls(),
          finish: true, // 是否结束
          retry: 0, // 重试次数
          total: urlManager.getTotal(),
          index: urlManager.getTotal(),
        },
      });
      subscriber.complete();
    };

    const observable = new Observable<MessageEvent>((subscriber) => {
      subscriber.next({
        data: {
          url: '', // 抓取处理连接
          completed: false, // 是否完成
          finish: false, // 是否结束
          retry: 0, // 重试次数
          total: urlManager.getTotal(),
          index: 0,
        },
      });

      logger.info('starting crawlFlow');
      crawlFlow(subscriber);
    });

    return observable;
  }

  @Put(':id/site/:siteId/crawler/:fileId')
  @ApiParam({
    name: 'id',
    example: '1',
    description: '知识库id',
    type: Number,
  })
  @ApiParam({
    name: 'siteId',
    example: '1',
    description: '站点',
    type: Number,
  })
  @ApiParam({
    name: 'fileId',
    example: '1',
    description: '对应文件id',
    type: Number,
  })
  @ApiOperation({
    summary: 'crawler 抓取某条数据',
  })
  @SerializerClass(CrawlerResultDto)
  async updateSigleWePage(
    @Param('id', ParseIntPipe) pk: number,
    @Param('siteId', ParseIntPipe) siteId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @User() user: RequestUser,
  ): Promise<CrawlerResultDto> {
    const [kbIns, kbSiteIns, kbFile] = await Promise.all([
      this.kbService.findByPk(pk),
      this.kbSiteService.findByPk(siteId),
      this.kbFileService.findByPk(fileId),
    ]);
    this.check_owner(kbIns, user.id);
    this.check_owner(kbSiteIns, user.id);
    this.check_owner(kbFile, user.id);

    // 获取站点的目录
    const kbResRoot = this.kbService.getKbRoot(kbIns.ownerId, kbIns.id);
    const sourceUrl = kbFile.sourceUrl;

    this.logger.info(`start at ${sourceUrl}`);

    let completed = false;

    try {
      const { content } = await this.crawlerService.crawlLinksAndContent(
        kbSiteIns.engineType,
        sourceUrl,
        undefined,
        kbSiteIns.removeSelectors,
      );
      this.logger.info(`crawlLinksAndContent finish at ${sourceUrl}`);
      // 保存 内容
      await this.kbResService.saveContent(
        kbResRoot,
        kbSiteIns.title,
        sourceUrl,
        content,
        kbSiteIns.fileSuffix,
      );
      // 数据库操作
      await this.kbFileService.updateByPk(kbFile.id, {
        summary: kbFile.summary,
        sourceUrl: kbFile.sourceUrl,
      });
      completed = true;
    } catch (error) {
      this.logger.warn('crawl failed');
    }

    return {
      url: sourceUrl,
      completed,
      retry: 0,
      finish: true,
      total: 1,
      index: 1,
    };
  }
}
