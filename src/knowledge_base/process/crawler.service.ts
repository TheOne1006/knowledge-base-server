import { chromium } from 'playwright';
// import * as fs from 'fs-extra';
// import * as path from 'path';
import * as cheerio from 'cheerio';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import {
  PlaywrightWebBaseLoader,
  // Page,
  // Browser,
} from 'langchain/document_loaders/web/playwright';
import { Injectable, Inject } from '@nestjs/common';
import { urlRemoveHash, toAbsoluteURL } from '../utils/link-format';

PlaywrightWebBaseLoader.imports = async () => ({ chromium });

@Injectable()
export class CrawlerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
  ) {}

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

    $('img[src]').map((_, el) => {
      const item = $(el).attr('src');
      if (item && !item.startsWith('src')) {
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
  ): Promise<{ links: string[]; html: string }> {
    const urlObj = new URL(url);
    const hostname = `${urlObj.protocol}//${urlObj.hostname}`;

    const loader = new PlaywrightWebBaseLoader(url, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: 'domcontentloaded',
      },
    });

    // 读取 loaderr 的 pageContent，放入 cheerio 中
    const docs = await loader.load();
    const html = docs[0].pageContent;
    const $ = cheerio.load(html);

    this.appendBase2Head($, hostname);
    this.changeLinks($, url);

    // 获取所有 a[href] 的链接
    let links = $(linkSelector)
      .map((_, el) => $(el).attr('href'))
      .get();

    // 删除hash
    links = links.map((link) => urlRemoveHash(link).href);

    // 去重
    const linkSet = new Set(links);

    this.removeDoms($, removeSelectors);

    return {
      links: [...linkSet],
      html: $.html(),
    };
  }
}
