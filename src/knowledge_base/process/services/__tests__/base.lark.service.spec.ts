import { join } from 'path';
import * as fs from 'fs';
import { Client } from '@larksuiteoapi/node-sdk';
import { BaseLarkService } from '../base.lark.service';

describe('BaseLarkService', () => {
  jest.setTimeout(60000);
  let service: BaseLarkService;
  let mockClient: jest.Mocked<Client>;

  describe.skip('with mock', () => {
    beforeEach(() => {
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

      service = new BaseLarkService('pdf', 1);
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
  });

  describe('with truly token', () => {
    const targetDownloadPath = join(__dirname, 'mock_files', './test.doc');
    beforeEach(() => {
      service = new BaseLarkService('docx', 5);
      fs.rmSync(targetDownloadPath, { force: true });
    });

    it('full process success', async () => {
      const sourceFileToken = 'VM9DdoFDvo9VJlxALfycHq7MnPT';

      const ticket = await service.createExportTasks(sourceFileToken);

      const fileToken = await service.queryExportTasks(sourceFileToken, ticket);
      const downloadFile = await service.downloadFile(
        fileToken,
        sourceFileToken,
        join(__dirname, 'mock_files', './test.doc'),
      );

      expect(downloadFile).toEqual(targetDownloadPath);
    });
  });
});
