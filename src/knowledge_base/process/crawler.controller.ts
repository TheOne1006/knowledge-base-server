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
  // Put,
  // Delete,
  Param,
  ParseIntPipe,
  SetMetadata,
  MessageEvent,
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
import { FilesInterceptor } from '@nestjs/platform-express';
import pLimit from 'p-limit';
import { Observable } from 'rxjs';
import { I18nService } from 'nestjs-i18n';

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
import { BaseController } from '../base/base.controller';
import { KbResourceService } from './resource.service';
import { CrawlerService } from './crawler.service';
import { CrawlerDto } from './dtos';
import { CrawlerUrlsManager } from './libs/crawler-urls-manager';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/kb`)
@ApiSecurity('api_key')
@ApiTags('kb')
@UseInterceptors(SerializerInterceptor)
@Controller('kb')
export class KbSiteCrawlerController extends BaseController {
  constructor(
    private readonly kbService: KbService,
    private readonly kbSiteService: KbSiteService,
    private readonly kbResService: KbResourceService,
    private readonly crawlerService: CrawlerService,
    protected readonly i18n: I18nService,
  ) {
    super(i18n);
  }

  /**
   * crawler 抓取 部分数据
   */
  @Sse(':id/site/:siteId/crawler')
  @SetMetadata(METHOD_METADATA, RequestMethod.POST)
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
  @UseInterceptors(FilesInterceptor('files'))
  @SerializerClass(CrawlerDto)
  async crawler(
    @Param('id', ParseIntPipe) pk: number,
    @Param('siteId', ParseIntPipe) siteId: number,
    @Body() crawlerOption: CrawlerDto,
    @User() user: RequestUser,
  ): Promise<Observable<MessageEvent>> {
    const [bkIns, bkSiteIns] = await Promise.all([
      this.kbService.findByPk(pk),
      this.kbSiteService.findByPk(siteId),
    ]);
    this.check_owner(bkIns, user.id);
    this.check_owner(bkSiteIns, user.id);

    // 获取站点的目录
    const kbResRoot = this.kbService.getKbRoot(bkIns);
    const kbSiteResRoot = this.kbSiteService.getKbSiteRoot(
      kbResRoot,
      bkSiteIns,
    );

    const localAllPaths = await this.kbService.getAllFiles(
      bkIns,
      bkSiteIns.title,
      false,
    );
    const completedPaths = localAllPaths.map((item) => item.path);
    const completedUrls = this.kbSiteService.convertFilePathsToUrls(
      bkSiteIns,
      completedPaths,
    );

    // 获取开始的urls
    const fullUrls = this.kbSiteService.getFullStartUrls(bkSiteIns);
    // 长度与 fullUrls 一致
    const completed = new Array(fullUrls.length).fill(false);

    const observable = new Observable<MessageEvent>((observer) => {
      observer.next({
        data: {
          urls: fullUrls,
          completed,
          finish: false,
        },
      });
    });

    // 控制并发数
    const concurrency = crawlerOption.concurrency;
    const limit = pLimit(concurrency);
    // 最大抓取页面
    const maxConnections = crawlerOption.maxConnections;

    // url 管理
    const urlManager = new CrawlerUrlsManager(
      fullUrls,
      maxConnections,
      maxConnections,
      crawlerOption.type,
      completedUrls,
    );

    // const tryCrawler = (url: string) => {
    //   const { links, html } = await this.crawlerService.crawlLinksAndHtml(url, crawlerOption.linkSelector, bkSiteIns.removeSelectors);
    // }

    // 当 i < maxConnections 或者 i < fullUrls.length 时, 继续抓取
    while (urlManager.hasNextBatch()) {
      // 当前需要抓取的连接
      const urls = urlManager.getNextBatch();

      await Promise.all(
        urls.map((url: string) => {
          limit(async () => {
            // 爬取链接 以及下载 html
            try {
              const { links, html } =
                await this.crawlerService.crawlLinksAndHtml(
                  url,
                  crawlerOption.linkSelector,
                  bkSiteIns.removeSelectors,
                );
              // 加入 urls 队列中
              urlManager.addUrlsFromCrawler(links);
              // 保存 html
              await this.kbResService.saveHtml(kbSiteResRoot, url, html);
            } catch (error) {
              urlManager.addRetryUrl(url);
            }
          });
        }),
      );
    }

    return observable;
  }
}
