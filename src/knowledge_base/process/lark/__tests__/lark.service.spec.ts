import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'winston';
import {
  Client,
  // LoggerLevel
} from '@larksuiteoapi/node-sdk';
import { LarkService } from '../lark.service';
import { LarkDocs2Md } from '../../../../libs/lockdoc2md/main';

describe('Test LarkService', () => {
  let service: LarkService;
  let mockLogger: Logger;
  let mockLarkDocs2Md: LarkDocs2Md;
  let mockClient: jest.Mocked<Client>;

  beforeEach(async () => {
    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as any as Logger;

    mockLarkDocs2Md = {
      link2md: jest.fn().mockResolvedValue('# title1'),
    } as any as LarkDocs2Md;

    mockClient = {
      drive: {
        exportTask: {
          create: jest.fn().mockResolvedValue({
            code: 0,
            msg: 'ok',
            data: {
              ticket: 'testTicket123',
            },
          }),
          get: jest.fn().mockResolvedValue({
            code: 0,
            msg: 'ok',
            data: {
              result: {
                file_token: 'tmp_token',
              },
            },
          }),
          download: jest.fn().mockResolvedValue({
            writeFile: jest.fn(),
          }),
        },
      },
    } as any as jest.Mocked<Client>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LarkService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<LarkService>(LarkService);
    service['doc2mdService'] = mockLarkDocs2Md;
    service['client'] = mockClient;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExportTasks', () => {
    it('should call the correct method with the correct parameters', async () => {
      const fileToken = 'testToken';

      const result = await service.createExportTasks(fileToken);
      expect(result).toBe('testTicket123');
    });

    it('should throw an error when the result code is not 0', async () => {
      mockClient.drive.exportTask.create = jest.fn().mockResolvedValueOnce({
        code: 1,
        msg: 'error',
      });

      await expect(service.createExportTasks('testToken')).rejects.toThrow(
        'createExportTasks: error with source testToken',
      );
    });
  });

  describe('queryExportTasks', () => {
    it('should call the correct method with the correct parameters', async () => {
      const sourceFileToken = 'sourceTestToken';
      const ticket = 'testTicket';
      const result = await service.queryExportTasks(sourceFileToken, ticket);

      expect(result).toBe('tmp_token');
    });

    it('should throw an error when the result code is not 0', async () => {
      mockClient.drive.exportTask.get = jest.fn().mockResolvedValue({
        code: 1,
        msg: 'error',
      });

      await expect(
        service.queryExportTasks('testToken', 'testTicket'),
      ).rejects.toThrow('queryExportTasks: error with source testToken');
    });
  });

  describe('downloadFile', () => {
    it('should call the correct method with the correct parameters', async () => {
      const fileToken = 'testToken';
      const sourceFileToken = 'sourceTestToken';
      const targetPath = 'testPath';

      const result = await service.downloadFile(
        fileToken,
        sourceFileToken,
        targetPath,
      );

      expect(result).toBe('testPath');
    });

    it('should throw an error when downlooad', async () => {
      mockClient.drive.exportTask.download = jest
        .fn()
        .mockRejectedValue(new Error('download err'));

      await expect(
        service.downloadFile('fileToken', 'testToken', 'target'),
      ).rejects.toThrow('downloadFile: download err with source testToken');
    });
  });

  describe('downloadDocx', () => {
    test('downloadDocx success function', async () => {
      const actual = await service.downloadFile(
        'fileToken',
        'sourceToken',
        '/tmp/mocked/path.docx',
      );
      const expected = '/tmp/mocked/path.docx';

      expect(actual).toBe(expected);
    });
  });

  describe('link2md', () => {
    it('should call the correct method with the correct parameters', async () => {
      const actual = await service.link2md('link');
      const expected = '# title1';

      expect(actual).toBe(expected);
    });
  });
});
