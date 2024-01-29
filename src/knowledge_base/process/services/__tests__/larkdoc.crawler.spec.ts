import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'winston';
import { LarkDocCrawlerService } from '../larkdoc.crawler';
import { BaseLarkService } from '../base.lark.service';
// import fetch from 'node-fetch';
// jest.mock('node-fetch');

describe('LarkDocCrawlerService Crawler', () => {
  let service: LarkDocCrawlerService;
  let mockLogger: Logger;
  let mockLark: BaseLarkService;

  beforeEach(async () => {
    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as any as Logger;

    mockLark = {
      createExportTasks: jest.fn().mockResolvedValue('testTicket123'),
      queryExportTasks: jest.fn().mockResolvedValue('tmp_token'),
      downloadFile: jest.fn().mockResolvedValue('/tmp/mocked/path.docx'),
    } as any as BaseLarkService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LarkDocCrawlerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<LarkDocCrawlerService>(LarkDocCrawlerService);
    service['lark'] = mockLark;
  });

  describe('downloadDocx', () => {
    test('downloadDocx success function', async () => {
      const actual = await service.downloadDocx(
        'sourceToken',
        '/tmp/mocked/path.docx',
      );
      const expected = '/tmp/mocked/path.docx';
      expect(actual).toBe(expected);
    });
  });
});
