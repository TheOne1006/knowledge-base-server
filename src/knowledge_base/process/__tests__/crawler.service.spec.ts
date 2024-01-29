import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from '../crawler.service';
import { LarkService } from '../lark';
import { PlaywrightService } from '../playwright';

describe('Test CrawlerService', () => {
  let service: CrawlerService;
  let mockLogger: Logger;
  let mockPlaywrightService: PlaywrightService;
  let mockLarkService: LarkService;

  beforeEach(async () => {
    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as any as Logger;

    mockLarkService = {
      link2md: jest.fn().mockResolvedValue('# title1'),
    } as any as LarkService;

    mockPlaywrightService = {
      crawlLinksAndHtml: jest.fn().mockResolvedValue({
        links: ['link1', 'link2'],
        html: '<html><head></head><body><div>Content</div></body></html>',
      }),
      crawlLinks: jest.fn().mockResolvedValue(['link1', 'link2']),
    } as any as PlaywrightService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: PlaywrightService,
          useValue: mockPlaywrightService,
        },
        {
          provide: LarkService,
          useValue: mockLarkService,
        },
      ],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crawlLinksAndContent', () => {
    it('should fetch and process HTML from the provided URL with playwright', async () => {
      const url = path.join(__dirname, 'mock_files', 'mock_html.html');
      const engineType = 'playwright';
      const linkSelector = 'a[href]';
      const removeSelectors = ['footer', '.ad'];
      const { links, content } = await service.crawlLinksAndContent(
        engineType,
        `file://${url}`,
        linkSelector,
        removeSelectors,
        '',
      );

      const expectedLinks = ['link1', 'link2'];
      const expectedHtml =
        '<html><head></head><body><div>Content</div></body></html>';
      expect(links).toEqual(expectedLinks);
      expect(content).toEqual(expectedHtml);
    });

    it('should fetch and process lark md from the provided URL with md', async () => {
      // console.log(url);
      const { links, content } = await service.crawlLinksAndContent(
        'lark2md',
        `htttp://feishu.com/xxx`,
        '',
        [],
        '',
      );

      const expectedLinks = ['link1', 'link2'];
      const expectedContent = '# title1';
      expect(links).toEqual(expectedLinks);
      expect(content).toEqual(expectedContent);
    });
  });
});
