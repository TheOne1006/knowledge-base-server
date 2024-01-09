import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerController } from '../crawler.controller';
import { KbService } from '../../kb/kb.service';
import { KbSiteService } from '../../site/site.service';
import { CrawlerService } from '../crawler.service';
import { KbResourceService } from '../resource.service';
import { I18nService } from 'nestjs-i18n';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { Logger } from 'winston';

import { CrawlerDto, CrawlerResultDto } from '../dtos';

describe('CrawlerController', () => {
  const mockLogger = {
    warn: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as any as Logger;
  let controller: CrawlerController;
  let KbServiceMock: KbService;
  let KbSiteServiceMock: KbSiteService;
  let CrawlerServiceMock: CrawlerService;
  let KbResourceServiceMock: KbResourceService;
  let I18nServiceMock: I18nService;
  let crawlerOption: CrawlerDto;

  describe('crawler success', () => {
    beforeEach(async () => {
      KbServiceMock = {
        findByPk: jest.fn().mockImplementation(() => ({
          id: 1,
          title: 'title',
          ownerId: 1,
        })),
        getKbRoot: jest.fn().mockImplementation(() => '/path'),
        getAllFiles: jest
          .fn()
          .mockImplementation(() => ['/path', '/path1', '/path2']),
      } as any as KbService;

      KbSiteServiceMock = {
        findByPk: jest.fn().mockImplementation(() => ({
          id: 1,
          title: 'title',
          pattern: 'http',
          ownerId: 1,
        })),
        getKbSiteRoot: jest.fn().mockImplementation(() => '/path/site'),
        getAllFiles: jest
          .fn()
          .mockImplementation(() => ['/path/file1', '/path/file2']),
        convertPathsToUrls: jest
          .fn()
          .mockImplementation(() => [
            'http://example.com/path/file1',
            'http://example.com/path/file2',
          ]),
        getFullStartUrls: jest
          .fn()
          .mockImplementation(() => [
            'http://example.com/path1',
            'http://example.com/path2',
          ]),
      } as any as KbSiteService;

      CrawlerServiceMock = {
        crawlLinksAndHtml: jest
          .fn()
          .mockRejectedValueOnce(new Error('error'))
          .mockImplementation(() => ({
            links: ['http://example.com/link1', 'http://example.com/link2'],
            html: '<html><h1>title</h1></html>',
          })),
      } as any as CrawlerService;

      KbResourceServiceMock = {
        saveHtml: jest.fn().mockImplementation(() => true),
      } as any as KbResourceService;

      I18nServiceMock = {} as any as I18nService;

      const module: TestingModule = await Test.createTestingModule({
        controllers: [CrawlerController],
        providers: [
          {
            provide: CrawlerService,
            useValue: CrawlerServiceMock,
          },
          {
            provide: KbResourceService,
            useValue: KbResourceServiceMock,
          },
          {
            provide: I18nService,
            useValue: I18nServiceMock,
          },
          {
            provide: KbService,
            useValue: KbServiceMock,
          },
          {
            provide: KbSiteService,
            useValue: KbSiteServiceMock,
          },
          {
            provide: WINSTON_MODULE_PROVIDER,
            useValue: mockLogger,
          },
        ],
      }).compile();

      controller = module.get<CrawlerController>(CrawlerController);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    crawlerOption = {
      maxConnections: 10,
      concurrency: 1,
      linkSelector: 'a[href]',
      type: 'all',
    };

    const reqUser = {
      id: 1,
      username: 'user',
      email: '',
      roles: [],
    };

    it('should return an Observable', async () => {
      const observable = await controller.crawler(1, 1, crawlerOption, reqUser);
      expect(observable).toBeInstanceOf(Observable);

      const actual = [];
      // const errorList = [];

      await new Promise((resolve) => {
        observable.subscribe({
          next(x) {
            const data = x.data as CrawlerResultDto;
            actual.push(data);
          },
          error(error) {
            // const data = x.data as CrawlerResultDto;
            // errorList.push(data);
            console.error('发生错误: ' + error);
          },
          complete() {
            resolve('');
          },
        });
      });

      const expected = [
        {
          url: '',
          completed: false,
          finish: false,
          retry: 0,
          total: 2,
          index: 0,
        },
        {
          url: 'http://example.com/path1',
          completed: false,
          retry: 0,
          finish: false,
          total: 2,
          index: 0,
        },
        {
          url: 'http://example.com/path2',
          completed: true,
          retry: 0,
          finish: false,
          total: 4,
          index: 1,
        },
        {
          url: 'http://example.com/link1',
          completed: true,
          retry: 0,
          finish: false,
          total: 4,
          index: 2,
        },
        {
          url: 'http://example.com/link2',
          completed: true,
          retry: 0,
          finish: false,
          total: 4,
          index: 3,
        },
        {
          url: 'http://example.com/path1',
          completed: true,
          retry: 0,
          finish: false,
          total: 4,
          index: 0,
        },
        {
          url: '',
          completed: false,
          successUrls: [
            'http://example.com/path1',
            'http://example.com/path2',
            'http://example.com/link1',
            'http://example.com/link2',
          ],
          failedUrls: [],
          finish: true,
          retry: 0,
          total: 4,
          index: 4,
        },
      ];

      // 如何监测 obser 的 complete
      expect(actual.length).toBe(7);
      expect(actual).toEqual(expected);
    });

    // Add more tests here for different scenarios and edge cases
  });
});
