import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Injectable, Inject } from '@nestjs/common';
import { PlaywrightService } from './playwright';
import { LarkService } from './lark';
import {
  CRAWLER_ENGINE_PLAYWRIGHT,
  CRAWLER_ENGINE_LARK_MD,
} from '../site/constants/engin.type';

@Injectable()
export class CrawlerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject(PlaywrightService)
    private readonly playwrightService: PlaywrightService,
    @Inject(LarkService)
    private readonly larkService: LarkService,
  ) {}

  /**
   * 开始爬虫
   * @param  {string} url
   * @returns {Promise<{links: string[], content: string}>}
   */
  async crawlLinksAndContent(
    engineType: string,
    url: string,
    linkSelector: string = 'a[href]',
    removeSelectors: string[] = [],
    evaluateFuncString: string = '',
  ): Promise<{ links: string[]; content: string }> {
    if (engineType === CRAWLER_ENGINE_PLAYWRIGHT) {
      const { links, html } = await this.playwrightService.crawlLinksAndHtml(
        url,
        linkSelector,
        removeSelectors,
        evaluateFuncString,
      );
      return {
        links,
        content: html,
      };
    } else if (engineType === CRAWLER_ENGINE_LARK_MD) {
      // const evaluateFuncString = `
      //     await page.waitForSelector(".sidebar-container");
      //     const elementHandle = await page.$('.sidebar-container');
      //     return elementHandle.innerHTML();
      // `;
      const links = await this.playwrightService.crawlLinks(
        url,
        'a[href]',
        evaluateFuncString,
      );
      const content = await this.larkService.link2md(url);
      return {
        links,
        content,
      };
    }

    throw new Error(`disabled engineType: ${engineType}`);
  }
}
