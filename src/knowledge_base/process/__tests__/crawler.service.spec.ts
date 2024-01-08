import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from '../crawler.service';

import { KbResourceService } from '../resource.service';

describe('Test CrawlerService', () => {
  jest.setTimeout(10000);
  let service: CrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlerService, KbResourceService],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
