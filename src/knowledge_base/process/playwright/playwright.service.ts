import { Injectable, Inject } from '@nestjs/common';
import { Logger } from 'winston';
import * as cheerio from 'cheerio';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CustomPlaywrightWebBaseLoader } from '../loaders/CustomPlaywrightWebBaseLoader';
import {
  urlRemoveHash,
  toAbsoluteURL,
  isValidUrl,
} from '../../utils/link-format';

@Injectable()
export class PlaywrightService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
  ) {}

  // page.head 添加 一个 <base href="hostname" /> 标签
  protected appendBase2Head($: cheerio.CheerioAPI, hostname: string) {
    $('head').append(`<base href="${hostname}" />`);
  }

  /**
   * 将 *[href] 链接替换成绝对路径
   * @param {cheerio.CheerioAPI} $
   * @param {string} base
   */
  protected changeLinks($: cheerio.CheerioAPI, base: string) {
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
   * 将 *[src] 链接替换成绝对路径
   * @param {cheerio.CheerioAPI} $
   * @param {string} base
   */
  protected changeSrc($: cheerio.CheerioAPI, base: string) {
    $('*[src]').map((_, el) => {
      const item = $(el).attr('src');
      // 不包含 : 且并不以 http 开头
      if (item && !/\:/.test(item) && !item.startsWith('http')) {
        $(el).attr('src', toAbsoluteURL(base, item));
      }
    });
  }

  /**
   * 根据 removeSelectors 使用 cheerio 删除指定的元素
   * @param {cheerio.CheerioAPI} $
   * @param removeSelectors
   */
  private removeDoms($: cheerio.CheerioAPI, removeSelectors: string[]) {
    // 根据 removeSelectors 使用 cheerio 删除指定的元素
    for (const selector of removeSelectors) {
      // 删除全部
      $(selector).remove();
    }
  }

  /**
   * 爬取 url 以及执行 evaluate
   * @param  {string} url
   * @param  {string} evaluateFuncString 支持 es6, 需要返回 string
   * @returns {Promise<string>}
   */
  async crawlUrlAndEvaluate(
    url: string,
    evaluateFuncString: string = '',
  ): Promise<string> {
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
      this.logger.error(`crawlUrlAndEvaluate: error with: ${url}`);
      throw error;
    }
    this.logger.info(`crawlUrlAndEvaluate start: ${url}`);

    let docs: any[];

    try {
      docs = await loader.load();
    } catch (error) {
      // console.log(error);
      throw error;
    }
    this.logger.info(`crawlUrlAndEvaluate finish: ${url}`);
    const html = docs[0].pageContent;
    return html;
  }

  /**
   * 开始爬虫
   * @param  {string} url
   * @returns {Promise<{links: string[], html: string}>}
   */
  async crawlLinksAndHtml(
    url: string,
    linkSelector: string = 'a[href]',
    removeSelectors: string[] = [],
    evaluateFuncString: string = '',
  ): Promise<{ links: string[]; html: string }> {
    // 传入的 evaluateFuncString 会被转换成一个函数

    const urlObj = new URL(url);
    const hostname = `${urlObj.protocol}//${urlObj.hostname}`;

    const html = await this.crawlUrlAndEvaluate(url, evaluateFuncString);
    const $ = cheerio.load(html);

    this.appendBase2Head($, hostname);
    this.changeLinks($, url);
    this.changeSrc($, url);

    // 获取所有 a[href] 的链接
    let links = $(linkSelector)
      .map((_, el) => $(el).attr('href'))
      .get();

    // 过滤 url 后, 删除hash
    links = links.filter(isValidUrl).map((link) => urlRemoveHash(link).href);

    // 去重
    const linkSet = new Set(links);

    this.removeDoms($, removeSelectors);

    return {
      links: [...linkSet],
      html: $.html(),
    };
  }

  /**
   * 爬取链接
   * @param  {string} url
   * @param  {string} linkSelector
   * @param  {string} evaluateFuncString
   * @returns {Promise<string[]>}
   */
  async crawlLinks(
    url: string,
    linkSelector: string = 'a[href]',
    evaluateFuncString: string = '',
  ): Promise<string[]> {
    const html = await this.crawlUrlAndEvaluate(url, evaluateFuncString);
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
