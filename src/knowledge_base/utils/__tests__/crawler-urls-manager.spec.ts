import {
  CRAWLER_TYPE_ALL,
  CRAWLER_TYPE_INCREMENTAL,
} from '../../process/constants';
import { CrawlerUrlsManager } from '../crawler-urls-manager';

describe('CrawlerUrlsManager', () => {
  let crawlerUrlsManager: any; // CrawlerUrlsManager
  beforeEach(() => {
    crawlerUrlsManager = new CrawlerUrlsManager(
      ['^http://example.com/'],
      ['djksaakskaskdsajfkds'],
    ) as any;
  });

  describe('appendUrls 添加 urls', () => {
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

  describe('excludeLocalUrls', () => {
    const table = [
      {
        localUrls: ['http://example.com/path1.html'],
        urls: ['http://example.com/path1', 'http://example.com/path2'],
        expected: ['http://example.com/path2'],
      },
      {
        localUrls: ['http://example.com/path1.html'],
        urls: [
          'http://example.com/path1.php?c=123',
          'http://example.com/path2',
        ],
        expected: [
          'http://example.com/path1.php?c=123',
          'http://example.com/path2',
        ],
      },
    ];

    it.each(table)('get different urls', ({ localUrls, urls, expected }) => {
      crawlerUrlsManager.localUrls = localUrls;
      const result = crawlerUrlsManager.excludeLocalUrls(urls);
      expect(result).toEqual(expected);
    });
  });

  describe('filterUrlsWithPattern', () => {
    const table = [
      {
        _title: 'ignorePatterns is empty',
        matchPatterns: [new RegExp('^http://example.com/')],
        ignorePatterns: [],
        urls: ['http://example1.com/path1', 'http://example.com/path2'],
        expected: ['http://example.com/path2'],
      },
      {
        _title: 'ignorePatterns match',
        matchPatterns: [new RegExp('^http://example.com/')],
        ignorePatterns: [new RegExp('^http://example.com/path1')],
        urls: ['http://example.com/path1', 'http://example.com/path2'],
        expected: ['http://example.com/path2'],
      },
      {
        _title: 'more matchPatterns',
        matchPatterns: [
          new RegExp('^http://example2.com/'),
          new RegExp('^http://example.com/'),
        ],
        ignorePatterns: [new RegExp('^http://example.com/path1')],
        urls: ['http://example1.com/path1', 'http://example.com/path2'],
        expected: ['http://example.com/path2'],
      },
    ];

    describe.each(table)(
      'get patterns urls',
      ({ _title, matchPatterns, ignorePatterns, urls, expected }) => {
        it(_title, () => {
          crawlerUrlsManager.matchPatterns = matchPatterns;
          crawlerUrlsManager.ignorePatterns = ignorePatterns;
          const result = crawlerUrlsManager.filterUrlsWithPattern(urls);
          expect(result).toEqual(expected);
        });
      },
    );
  });

  describe('addUrlsFromCrawler', () => {
    it(`with type: ${CRAWLER_TYPE_ALL}`, () => {
      const urls = ['http://example.com/path1', 'http://example.com/path2'];
      crawlerUrlsManager.localUrls = ['http://example.com/path1.html'];
      crawlerUrlsManager.type = CRAWLER_TYPE_ALL;
      crawlerUrlsManager.addUrlsFromCrawler(urls);

      crawlerUrlsManager.addUrlsFromCrawler(urls);
      const result = crawlerUrlsManager.urls;

      expect(result).toEqual(urls);
    });

    it(`with type: ${CRAWLER_TYPE_INCREMENTAL}`, () => {
      const urls = ['http://example.com/path1', 'http://example.com/path2'];
      crawlerUrlsManager.localUrls = ['http://example.com/path1.html'];
      crawlerUrlsManager.type = CRAWLER_TYPE_INCREMENTAL;
      crawlerUrlsManager.addUrlsFromCrawler(urls);
      const result = crawlerUrlsManager.urls;
      const expected = ['http://example.com/path2'];
      expect(result).toEqual(expected);
    });
  });

  describe('addRetryUrl', () => {
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

  describe('getUrlRetryUrlTimes', () => {
    const table = [
      {
        _title: 'should return 0 if the url is not in retryUrlItems',
        retryUrlItems: {},
        url: 'http://example.com/path1',
        expected: 0,
      },
      {
        _title: 'should return the retry times if the url is in retryUrlItems',
        retryUrlItems: {
          'http://example.com/path1': 2,
          'http://example.com/path2': 3,
        },
        url: 'http://example.com/path1',
        expected: 2,
      },
    ];

    describe.each(table)(
      'getUrlRetryUrlTimes test',
      ({ _title, retryUrlItems, url, expected }) => {
        beforeEach(() => {
          crawlerUrlsManager.retryUrlItems = retryUrlItems;
        });

        it(_title, () => {
          const result = crawlerUrlsManager.getUrlRetryUrlTimes(url);
          expect(result).toEqual(expected);
        });
      },
    );
  });

  describe('clearRetryUrl', () => {
    it('should clear the retry url if it exists', () => {
      const url = 'http://example.com/path2';
      crawlerUrlsManager.retryUrlItems = {
        [url]: 1,
      };
      crawlerUrlsManager.clearRetryUrl(url);
      expect(crawlerUrlsManager.retryUrlItems[url]).toBeUndefined();
    });

    it('should not throw an error if the retry url does not exist', () => {
      const url = 'http://example.com/path3';
      crawlerUrlsManager.retryUrlItems = {};
      expect(() => crawlerUrlsManager.clearRetryUrl(url)).not.toThrow();
    });
  });

  describe('getTotal', () => {
    const table = [
      {
        _title:
          'should return the length of urls when it is less than maxConnections',
        urls: ['http://example.com/path1', 'http://example.com/path2'],
        maxConnections: 5,
        expected: 2,
      },
      {
        _title:
          'should return maxConnections when it is less than the length of urls',
        urls: [
          'http://example.com/path1',
          'http://example.com/path2',
          'http://example.com/path3',
          'http://example.com/path4',
          'http://example.com/path5',
          'http://example.com/path6',
        ],
        maxConnections: 5,
        expected: 5,
      },
    ];

    describe.each(table)(
      'getTotal test',
      ({ _title, urls, maxConnections, expected }) => {
        beforeEach(() => {
          crawlerUrlsManager.urls = urls;
          crawlerUrlsManager.maxConnections = maxConnections;
        });

        it(_title, () => {
          const result = crawlerUrlsManager.getTotal();
          expect(result).toEqual(expected);
        });
      },
    );
  });

  describe('getUrlIndex', () => {
    const table = [
      {
        _title:
          'should return the index of the url if it exists in the urls array',
        urls: ['http://example.com/path1', 'http://example.com/path2'],
        url: 'http://example.com/path1',
        expected: 0,
      },
      {
        _title: 'should return -1 if the url does not exist in the urls array',
        urls: ['http://example.com/path1', 'http://example.com/path2'],
        url: 'http://example.com/path3',
        expected: -1,
      },
      {
        _title: 'should return -1 if the urls array is empty',
        urls: [],
        url: 'http://example.com/path1',
        expected: -1,
      },
    ];

    describe.each(table)(
      'getUrlIndex test',
      ({ _title, urls, url, expected }) => {
        beforeEach(() => {
          crawlerUrlsManager.urls = urls;
        });

        it(_title, () => {
          const result = crawlerUrlsManager.getUrlIndex(url);
          expect(result).toEqual(expected);
        });
      },
    );
  });

  describe('getProcessedUrls', () => {
    const table = [
      {
        _title:
          'should return all urls if currentPointer is greater than the length of urls',
        urls: ['http://example.com/path1', 'http://example.com/path2'],
        currentPointer: 3,
        expected: ['http://example.com/path1', 'http://example.com/path2'],
      },
      {
        _title: 'should return the first url if currentPointer is 1',
        urls: ['http://example.com/path1', 'http://example.com/path2'],
        currentPointer: 1,
        expected: ['http://example.com/path1'],
      },
      {
        _title: 'should return an empty array if currentPointer is 0',
        urls: ['http://example.com/path1', 'http://example.com/path2'],
        currentPointer: 0,
        expected: [],
      },
    ];

    describe.each(table)(
      'getProcessedUrls test',
      ({ _title, urls, currentPointer, expected }) => {
        beforeEach(() => {
          crawlerUrlsManager.urls = urls;
          crawlerUrlsManager.currentPointer = currentPointer;
        });

        it(_title, () => {
          const result = crawlerUrlsManager.getProcessedUrls();
          expect(result).toEqual(expected);
        });
      },
    );
  });

  describe('getFailedUrls', () => {
    const table = [
      {
        _title: 'should return all failed urls',
        retryUrlItems: {
          'http://example.com/path1': 1,
          'http://example.com/path2': 2,
        },
        expected: ['http://example.com/path1', 'http://example.com/path2'],
      },
      {
        _title: 'should return an empty array if there are no failed urls',
        retryUrlItems: {},
        expected: [],
      },
    ];

    describe.each(table)(
      'getFailedUrls test',
      ({ _title, retryUrlItems, expected }) => {
        beforeEach(() => {
          crawlerUrlsManager.retryUrlItems = retryUrlItems;
        });

        it(_title, () => {
          const result = crawlerUrlsManager.getFailedUrls();
          expect(result).toEqual(expected);
        });
      },
    );
  });
});
