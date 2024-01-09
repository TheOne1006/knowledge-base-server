import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Test, TestingModule } from '@nestjs/testing';
import {
  // PlaywrightWebBaseLoader,
  Page,
  // Browser,
} from 'langchain/document_loaders/web/playwright';
import * as cheerio from 'cheerio';
import { CrawlerService } from '../crawler.service';

describe('Test CrawlerService', () => {
  jest.setTimeout(10000);
  let service: CrawlerService;
  let mockLogger: Logger;

  beforeEach(async () => {
    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as any as Logger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('removeDoms', () => {
    it('should remove specified elements from html', () => {
      const html = '<div class="ad">Ad</div><div>Content</div>';
      const $ = cheerio.load(html);
      const removeSelectors = ['.ad'];

      // 使用类型断言来调用私有方法
      (service as any).removeDoms($, removeSelectors);

      expect($('body').html()).toBe('<div>Content</div>');
    });
  });

  // describe('crawl raw html to string', () => {
  //   it('get full html string', async () => {
  //     const { link, html } = await service.crawlLinkAndHtml(
  //       'https://www.langchain.asia/',
  //     );

  //     // console.log(htmlStr);
  //     expect([...link].length).toBeGreaterThan(200);
  //     expect(html.length).toBeGreaterThan(1000);
  //   });
  // });
});
