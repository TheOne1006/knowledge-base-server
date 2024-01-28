import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import * as cheerio from 'cheerio';
import { CrawlerService } from '../crawler.service';

describe('Test CrawlerService', () => {
  jest.setTimeout(60000);
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

  describe('changeLinks', () => {
    const table = [
      {
        _title: 'should change relative href/src to absolute',
        html: '<div><a href="/relative/path">Link</a><img src="/relative/path.jpg"/></div>',
        base: 'http://example.com',
        expected:
          '<html><head></head><body><div><a href="http://example.com/relative/path">Link</a><img src="http://example.com/relative/path.jpg"></div></body></html>',
      },
      {
        _title: 'should change absolute href/src to absolute',
        html: '<div><a href="http://example.com/relative/path">Link</a><img src="http://example.comrelative/path.jpg"/></div>',
        base: 'http://example.com',
        expected:
          '<html><head></head><body><div><a href="http://example.com/relative/path">Link</a><img src="http://example.comrelative/path.jpg"></div></body></html>',
      },
    ];

    describe.each(table)(
      'changeLinks each',
      ({ _title, html, base, expected }) => {
        it(_title, () => {
          const $ = cheerio.load(html);
          // Use type assertion to call private method
          (service as any).changeLinks($, base);
          expect($.html()).toBe(expected);
        });
      },
    );
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

  describe('crawlLinksAndHtml', () => {
    it('should fetch and process HTML from the provided URL', async () => {
      const url = path.join(__dirname, 'mock_files', 'mock_html.html');
      // console.log(url);
      const linkSelector = 'a[href]';
      const removeSelectors = ['footer', '.ad'];
      const { links, html } = await service.crawlLinksAndHtml(
        `file://${url}`,
        linkSelector,
        removeSelectors,
      );

      const expectedLinks = ['file:///relative/path', 'file:///relative/path2'];
      const expectedHtml =
        '<!DOCTYPEhtml><htmllang="en"><head><metacharset="UTF-8"><metaname="viewport"content="width=device-width,initial-scale=1.0"><title>mock1</title><basehref="file:///"></head><body><h1>title</h1><div><ahref="file:///relative/path">Link</a><ahref="file:///relative/path2">Link2</a><imgsrc="file:///relative/path.jpg"><div>Content</div></div></body></html>';
      // 去除 换行符
      const actualHtml = html.replace(/\n/g, '').replace(/\s/g, '');
      expect(links).toEqual(expectedLinks);
      expect(actualHtml).toEqual(expectedHtml);
    });

    it('should fetch and process HTML from the provided URL with default params', async () => {
      const url = path.join(__dirname, 'mock_files', 'mock_html.html');
      // console.log(url);
      const { links, html } = await service.crawlLinksAndHtml(`file://${url}`);

      const expectedLinks = ['file:///relative/path', 'file:///relative/path2'];
      const expectedHtml =
        '<!DOCTYPEhtml><htmllang="en"><head><metacharset="UTF-8"><metaname="viewport"content="width=device-width,initial-scale=1.0"><title>mock1</title><basehref="file:///"></head><body><h1>title</h1><div><ahref="file:///relative/path">Link</a><ahref="file:///relative/path2">Link2</a><imgsrc="file:///relative/path.jpg"><divclass="ad">Ad</div><divclass="ad">Ad2</div><div>Content</div></div><footer>footer</footer></body></html>';
      // 去除 换行符
      const actualHtml = html.replace(/\n/g, '').replace(/\s/g, '');
      expect(links).toEqual(expectedLinks);
      expect(actualHtml).toEqual(expectedHtml);
    });

    it('should fetch and process HTML from the provided URL with default evalua∫teFuncString with infinite scroll', async () => {
      const url = path.join(
        __dirname,
        'mock_files',
        'mock_infinite_scroll.html',
      );
      // console.log(url);

      const evaluateFuncString = `
          await page.evaluate(async () => {
                await new Promise((resolve) => {
                    var totalHeight = 0;
                    var distance = 100;
                    var timer = setInterval(() => {
                        var scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if(totalHeight >= scrollHeight){
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });
          return page.content();
      `;

      const { html } = await service.crawlLinksAndHtml(
        `file://${url}`,
        '',
        [],
        evaluateFuncString,
      );
      expect(html).toContain('title200');
    });

    it.skip('feishu dooc infinite scroll', async () => {
      const url =
        'https://pwnbqysk33g.feishu.cn/docx/JoV5dnUaMoCmPjx8K9xc76zSnXd?from=from_copylink';
      // console.log(url);

      const containerSelector = '.bear-web-x-container';
      const matchSelector = '.render-unit-wrapper';

      const evaluateFuncString = `
          await page.evaluate(async () => {
                await new Promise((resolve) => {
                    var totalHeight = 0;
                    var distance = 100;
                    var timer = setInterval(() => {
                        var scrollHeight = document.querySelector('${containerSelector}').scrollHeight;
                        document.querySelector('${containerSelector}').scrollBy(0, distance);
                        totalHeight += distance;

                        if(totalHeight >= scrollHeight){
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });
          const elementHandle = await page.$('${matchSelector}');
          return elementHandle.innerHTML();
      `;

      const { html } = await service.crawlLinksAndHtml(
        url,
        '',
        [],
        evaluateFuncString,
      );
      expect(html).toContain('title200');
    });
  });
});
