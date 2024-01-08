import { CRAWLER_TYPE_ALL, CRAWLER_TYPE_INCREMENTAL } from '../../constants';
import { CrawlerUrlsManager } from '../crawler-urls-manager';

describe('CrawlerUrlsManager', () => {
  let crawlerUrlsManager: any; // CrawlerUrlsManager

  describe('appendUrls 添加 urls', () => {
    beforeEach(() => {
      crawlerUrlsManager = new CrawlerUrlsManager() as any;
    });

    const table = [
      {
        originUrls: [],
        appendUrls: ['http://example.com/path1', 'http://example.com/path2'],
        expectedLen: 2,
      },
      {
        originUrls: ['http://example.com/path1', 'http://example.com/path2'],
        appendUrls: [],
        expectedLen: 2,
      },
      {
        originUrls: ['http://example.com/path1'],
        appendUrls: ['http://example.com/path1', 'http://example.com/path2'],
        expectedLen: 2,
      },
    ];

    it.each(table)(
      'should append new urls',
      ({ originUrls, appendUrls, expectedLen }) => {
        crawlerUrlsManager.urls = originUrls;
        crawlerUrlsManager.appendUrls(appendUrls);
        expect(crawlerUrlsManager.urls.length).toEqual(expectedLen);
      },
    );
  });

  describe('getNextBatch & hasNextBatch 获取下一批链接', () => {
    beforeEach(() => {
      crawlerUrlsManager = new CrawlerUrlsManager() as any;
    });

    const table = [
      {
        _title: 'all empty',
        currentPointer: 0,
        originUrls: [],
        retryUrlItems: {},
        expected: 0,
        expectedHas: false,
      },
      {
        _title: 'has originUrls',
        currentPointer: 0,
        originUrls: ['http://example.com/path1', 'http://example.com/path2'],
        retryUrlItems: {},
        expected: 2,
        expectedHas: true,
      },
      {
        _title: 'has retryUrlItems',
        currentPointer: 2,
        originUrls: ['http://example.com/path1', 'http://example.com/path2'],
        retryUrlItems: {
          'http://example.com/path3': 1,
          'http://example.com/path5': 1,
          'http://example.com/path6': 5,
        },
        expected: 2,
        expectedHas: true,
      },
      {
        _title: 'currentPointer > originUrls.length',
        currentPointer: 2,
        originUrls: ['http://example.com/path1', 'http://example.com/path2'],
        retryUrlItems: {},
        expected: 0,
        expectedHas: false,
      },
    ];

    describe.each(table)(
      'should get next urls and check if has next batch',
      ({
        _title,
        currentPointer,
        originUrls,
        retryUrlItems,
        expected,
        expectedHas,
      }) => {
        it(_title, () => {
          crawlerUrlsManager.currentPointer = currentPointer;
          crawlerUrlsManager.retryUrlItems = retryUrlItems;
          crawlerUrlsManager.urls = originUrls;
          const hasNextBatch = crawlerUrlsManager.hasNextBatch();
          const result = crawlerUrlsManager.getNextBatch();
          expect(result.length).toEqual(expected);
          expect(hasNextBatch).toEqual(expectedHas);
        });
      },
    );
  });

  describe('excludeCompletedUrls', () => {
    beforeEach(() => {
      crawlerUrlsManager = new CrawlerUrlsManager() as any;
    });

    it('get different urls', () => {
      const urls = ['http://example.com/path1', 'http://example.com/path2'];
      crawlerUrlsManager.completedUrls = ['http://example.com/path1.html'];
      const result = crawlerUrlsManager.excludeCompletedUrls(urls);
      expect(result).toEqual(['http://example.com/path2']);
    });
  });

  describe('addUrlsFromCrawler', () => {
    beforeEach(() => {
      crawlerUrlsManager = new CrawlerUrlsManager() as any;
    });

    it(`with type: ${CRAWLER_TYPE_ALL}`, () => {
      const urls = ['http://example.com/path1', 'http://example.com/path2'];
      crawlerUrlsManager.completedUrls = ['http://example.com/path1.html'];
      crawlerUrlsManager.type = CRAWLER_TYPE_ALL;
      crawlerUrlsManager.addUrlsFromCrawler(urls);

      crawlerUrlsManager.addUrlsFromCrawler(urls);
      const result = crawlerUrlsManager.urls;

      expect(result).toEqual(urls);
    });

    it(`with type: ${CRAWLER_TYPE_INCREMENTAL}`, () => {
      const urls = ['http://example.com/path1', 'http://example.com/path2'];
      crawlerUrlsManager.completedUrls = ['http://example.com/path1.html'];
      crawlerUrlsManager.type = CRAWLER_TYPE_INCREMENTAL;
      crawlerUrlsManager.addUrlsFromCrawler(urls);
      const result = crawlerUrlsManager.urls;
      const expected = ['http://example.com/path2'];
      expect(result).toEqual(expected);
    });
  });

  describe('addRetryUrl', () => {
    beforeEach(() => {
      crawlerUrlsManager = new CrawlerUrlsManager() as any;
    });

    it('first retry', () => {
      crawlerUrlsManager.addRetryUrl('http://example.com/path2');
      const result = crawlerUrlsManager.retryUrlItems;
      const expected = {
        'http://example.com/path2': 1,
      };
      expect(result).toEqual(expected);
    });

    it('seconnd retry', () => {
      crawlerUrlsManager.retryUrlItems = {
        'http://example.com/path2': 1,
      };
      crawlerUrlsManager.addRetryUrl('http://example.com/path2');

      const result = crawlerUrlsManager.retryUrlItems;
      const expected = {
        'http://example.com/path2': 2,
      };
      expect(result).toEqual(expected);
    });
  });
});
