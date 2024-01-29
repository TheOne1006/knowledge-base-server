import * as cheerio from 'cheerio';
import { Logger } from 'winston';

import {
  urlRemoveHash,
  toAbsoluteURL,
  isValidUrl,
} from '../../utils/link-format';

import { BasePlaywrightCrawlerService } from './base.playwright.crawler';
export class PlaywrightCrawlerService extends BasePlaywrightCrawlerService {
  protected readonly logger: Logger;
  constructor(logger: Logger) {
    super(logger);
  }

  // page.head 添加 一个 <base href="hostname" /> 标签
  private async appendBase2Head($: cheerio.CheerioAPI, hostname: string) {
    $('head').append(`<base href="${hostname}" />`);
  }

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
}
