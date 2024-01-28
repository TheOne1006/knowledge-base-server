// import * as fs from 'fs-extra';
// import * as path from 'path';
import * as cheerio from 'cheerio';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { CustomPlaywrightWebBaseLoader } from '../loaders/CustomPlaywrightWebBaseLoader';
import { Injectable, Inject } from '@nestjs/common';
import {
  urlRemoveHash,
  toAbsoluteURL,
  isValidUrl,
} from '../../utils/link-format';

@Injectable()
export class FeishuCrawlerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
  ) {}

  private async changeLinks($: cheerio.CheerioAPI, base: string) {
    // playwright page 根据 href 以 / 开头的连接 替换成 hostname + href + /endpoint
    $('*[href]').map((_, el) => {
      // 移除 a href 属性的空格 和 / 开头
      const item = $(el).attr('href');
      // item 包含 hostname
      if (item && !item.startsWith('http')) {
        $(el).attr('href', toAbsoluteURL(base, item));
      }
    });
  }

  /**
   * 开始爬虫
   * @param  {string} url
   * @returns {Promise<{links: string[], html: string}>}
   */
  async crawlLinks(
    url: string,
    linkSelector: string = 'a[href]',
    evaluateFuncString: string = '',
  ): Promise<string[]> {
    // 传入的 evaluateFuncString 会被转换成一个函数
    let evaluate: any;
    if (evaluateFuncString) {
      evaluate = new Function(
        'page',
        'browser',
        'response',
        'return (async () => {' + evaluateFuncString + '})();',
      );
    }

    let loader: CustomPlaywrightWebBaseLoader;
    try {
      loader = new CustomPlaywrightWebBaseLoader(url, {
        launchOptions: {
          headless: true,
        },
        gotoOptions: {
          timeout: 30 * 1000, // 30s
          /**
           * "load"：这个选项表示页面已经完成加载，包括所有的依赖资源如样式表和图片。
           * "domcontentloaded"：这个选项表示 HTML 文档已被完全加载和解析，不等待样式表、图像和子框架的完成加载。
           * "networkidle"：这个选项表示网络连接已经空闲，没有更多的资源正在加载。
           * "commit"：这个选项表示新的页面已经提交，即将开始加载。
           */
          waitUntil: 'domcontentloaded',
        },
        evaluate,
      });
    } catch (error) {
      this.logger.error('PlaywrightWebBaseLoader error with', url);
      throw error;
    }
    this.logger.info('load start:', url);

    // 读取 loaderr 的 pageContent，放入 cheerio 中
    let docs: any[];

    try {
      docs = await loader.load();
    } catch (error) {
      // console.log(error);
      throw error;
    }
    this.logger.info('load finish:', url);
    const html = docs[0].pageContent;
    const $ = cheerio.load(html);

    this.changeLinks($, url);

    // 获取所有 a[href] 的链接
    let links = $(linkSelector)
      .map((_, el) => $(el).attr('href'))
      .get();

    // 过滤 url 后, 删除hash
    links = links.filter(isValidUrl).map((link) => urlRemoveHash(link).href);

    // 去重
    const linkSet = new Set(links);

    return [...linkSet];
  }
}
