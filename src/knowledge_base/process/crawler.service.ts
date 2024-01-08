import { chromium } from 'playwright';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as cheerio from 'cheerio';

import {
  PlaywrightWebBaseLoader,
  Page,
  // Browser,
} from 'langchain/document_loaders/web/playwright';
import { Injectable } from '@nestjs/common';
import { KbResourceService } from './resource.service';
// import { CrawlerDto } from './dtos';

PlaywrightWebBaseLoader.imports = async () => ({ chromium });

@Injectable()
export class CrawlerService {
  constructor(private readonly kbResService: KbResourceService) {}

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
    const loader = new PlaywrightWebBaseLoader(url, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: 'domcontentloaded',
      },
      evaluate: async (page: Page) => {
        // 通过 page 获取 hostname
        const pageUrl = new URL(page.url());
        const hostname = `${pageUrl.protocol}://${pageUrl.hostname}`;

        // playwright page 添加 一个 <base href="hostname" /> 标签
        await page.evaluate((hostname) => {
          const base = document.createElement('base');
          base.href = hostname;
          document.head.prepend(base);
        }, hostname);

        // playwright page 根据 href 以 / 开头的连接 替换成 hostname + href + /endpoint
        // 替换所有链接的 href 属性
        await page.evaluate((hostname) => {
          // 获取页面上所有的链接
          const links = Array.from(document.querySelectorAll('a[href]'));
          // 遍历每个链接
          for (const link of links) {
            // 获取当前链接的 href 属性
            const href = link.getAttribute('href') || '';
            // 如果 href 属性以 / 开头, 替换为 hostname + /...
            if (href.startsWith('/')) {
              link.setAttribute('href', `${hostname}${href}`);
            }
          }
        }, hostname);

        const result = await page.evaluate(() => document.body.innerHTML);
        return result;
      },
    });

    // 读取 loaderr 的 pageContent，放入 cheerio 中
    const docs = await loader.load();
    const html = docs[0].pageContent;
    const $ = cheerio.load(html);

    // 获取所有 a[href] 的链接
    const links = $(linkSelector)
      .map((_, el) => $(el).attr('href'))
      .get();
    const linkSet = new Set(links);

    // 根据 removeSelectors 使用 cheerio 删除指定的元素
    for (const selector of removeSelectors) {
      $(selector).remove();
    }

    return {
      links: [...linkSet],
      html: $.html(),
    };
  }

  /**
   * 写入 html
   * @param {string} html
   * @param {string} filePath
   */
  async writeHTMLToFile(html: string, filePath: string): Promise<void> {
    // 检查目录是否存在, 如果不存在 则创建
    await this.kbResService.checkDir(path.dirname(filePath));
    // 将 html 写入文件
    await fs.writeFile(filePath, html);
  }
}
