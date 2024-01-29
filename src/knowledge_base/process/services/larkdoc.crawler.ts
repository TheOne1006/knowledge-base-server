import * as cheerio from 'cheerio';
import { Logger } from 'winston';
import {
  urlRemoveHash,
  toAbsoluteURL,
  isValidUrl,
} from '../../utils/link-format';
import { BasePlaywrightCrawlerService } from './base.playwright.crawler';
import { BaseLarkService } from './base.lark.service';

export class LarkDocCrawlerService extends BasePlaywrightCrawlerService {
  protected readonly logger: Logger;
  private lark: BaseLarkService;

  constructor(logger: Logger) {
    super(logger);

    this.lark = new BaseLarkService('docx', 1);
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
  }

  /**
   * 开始爬虫连接
   * @param  {string} url
   * @returns {Promise<{string[]}>}
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

  /**
   * 下载文件
   * @param {string} url
   * @returns {Promise<string>}
   */
  async downloadDocx(
    sourceFileToken: string,
    targetFilePath: string,
  ): Promise<string> {
    const ticket = await this.lark.createExportTasks(sourceFileToken);
    const tmpFileToken = await this.lark.queryExportTasks(
      sourceFileToken,
      ticket,
    );

    return this.lark.downloadFile(
      tmpFileToken,
      sourceFileToken,
      targetFilePath,
    );
  }
}
