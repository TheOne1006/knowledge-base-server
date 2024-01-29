import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as path from 'path';
import { PushDifyService } from '../dify.service';
import { of, throwError } from 'rxjs';

const mockFilePath = path.join(__dirname, 'mocks', 'mock.txt');

describe('PushDifyService', () => {
  let service: PushDifyService;
  let httpMockService: HttpService;
  let module: TestingModule;

  beforeAll(async () => {
    httpMockService = {
      post: jest.fn().mockImplementation(() =>
        of({
          data: {
            document: {
              id: 'id1',
              name: 'title1',
            },
          },
        }),
      ),
      delete: jest.fn().mockImplementation(() =>
        of({
          data: {
            result: 'success',
          },
        }),
      ),
      get: jest.fn().mockImplementation(() =>
        of({
          data: [
            {
              id: 'id1',
              name: 'title1',
            },
            {
              id: 'id2',
              name: 'title2',
            },
          ],
        }),
      ),
    } as any as HttpService;
    module = await Test.createTestingModule({
      providers: [
        PushDifyService,
        {
          provide: HttpService,
          useValue: httpMockService,
        },
        { provide: WINSTON_MODULE_PROVIDER, useValue: { error: jest.fn() } },
      ],
    }).compile();

    service = module.get<PushDifyService>(PushDifyService);
    // httpService = module.get<HttpService>(HttpService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkConfig', () => {
    const table = [
      {
        _title: 'allow rules',
        configIns: {
          additional: {
            proccess_rules: { foo: 1 },
          },
        },
        success: true,
      },
      {
        _title: 'bad rules with []',
        configIns: {
          additional: {
            proccess_rules: [],
          },
        },
        success: false,
      },
      {
        _title: 'allow empty {}',
        configIns: {
          additional: {
            proccess_rules: {},
          },
        },
        success: true,
      },
      {
        _title: 'allow proccess_rules empty',
        configIns: {
          additional: null,
        },
        success: true,
      },
      {
        _title: 'allow proccess_rules other attr',
        configIns: {
          additional: {
            other: '',
          },
        },
        success: true,
      },
      {
        _title: 'allow proccess_rules empty {}',
        configIns: {
          additional: {
            proccess_rules: {},
          },
        },
        success: true,
      },
      {
        _title: 'bad rules with Date',
        configIns: {
          additional: {
            proccess_rules: new Date(),
          },
        },
        success: false,
      },
    ];
    describe.each(table)('checkConfig', ({ _title, configIns, success }) => {
      it(_title, () => {
        let isSuccess = false;
        try {
          service.checkConfig(configIns as any);
          isSuccess = true;
        } catch (error) {
          isSuccess = false;
        }
        expect(isSuccess).toEqual(success);
      });
    });
  });

  describe('createOrUpdateByFile', () => {
    it('should create a document failed with not exists', async () => {
      await expect(
        service.createByFile('url', '/tmp/path/to/not_found', 'key', {}),
      ).rejects.toThrow('file not exists: /tmp/path/to/not_found');
    });

    it('should create a document failed', async () => {
      jest.spyOn(httpMockService, 'post').mockImplementationOnce(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'failed',
            },
          },
        })),
      );
      await expect(
        service.createByFile('url', mockFilePath, 'key', {}),
      ).rejects.toThrow('failed');
    });

    it('should create a document', async () => {
      const actual = await service.createByFile('url', mockFilePath, 'key', {});
      const expected = {
        id: 'id1',
        name: 'title1',
      };
      expect(actual).toEqual(expected);
    });
  });

  it('should delete a document failed', async () => {
    jest.spyOn(httpMockService, 'delete').mockImplementationOnce(() =>
      throwError(() => ({
        response: {
          data: {
            message: 'failed',
          },
        },
      })),
    );
    await expect(service.deleteByFile('url', 'docId', 'key')).rejects.toThrow(
      'failed',
    );
  });

  it('should delete a document', async () => {
    const actual = await service.deleteByFile('url', 'id', 'key');
    const expected = 'success';
    expect(actual).toEqual(expected);
  });

  it('should update a document failed', async () => {
    jest.spyOn(httpMockService, 'post').mockImplementationOnce(() =>
      throwError(() => ({
        response: {
          data: {
            message: 'failed',
          },
        },
      })),
    );
    await expect(
      service.updateByFile('url', 'id', mockFilePath, 'key', {}),
    ).rejects.toThrow('failed');
  });

  it('should update a document', async () => {
    const actual = await service.updateByFile(
      'url',
      'id',
      mockFilePath,
      'key',
      {},
    );
    const expected = {
      id: 'id1',
      name: 'title1',
    };
    expect(actual).toEqual(expected);
  });

  it('should query all documents failed', async () => {
    jest.spyOn(httpMockService, 'get').mockImplementationOnce(() =>
      throwError(() => ({
        response: {
          data: {
            message: 'failed',
          },
        },
      })),
    );
    await expect(service.queryDocuments('url', 'key')).rejects.toThrow(
      'failed',
    );
  });

  it('should query all documents', async () => {
    const expected = [
      {
        id: 'id1',
        name: 'title1',
      },
      {
        id: 'id2',
        name: 'title2',
      },
    ];

    const actual = await service.queryDocuments('url', 'key');

    expect(actual).toEqual(expected);
  });

  describe('queryAllDocuments', () => {
    it('should query all documents with multiple pages', async () => {
      jest
        .spyOn(service, 'queryDocuments')
        .mockResolvedValueOnce({
          total: 200,
          data: new Array(100).fill({ id: 'id1', name: 'title1' }),
          has_more: true,
          limit: 100,
          page: 1,
        })
        .mockResolvedValueOnce({
          total: 200,
          data: new Array(100).fill({ id: 'id2', name: 'title2' }),
          has_more: false,
          limit: 100,
          page: 2,
        });

      const actual = await service.queryAllDocuments('url', 'key', 'keyword');
      const expected = [
        ...new Array(100).fill({ id: 'id1', name: 'title1' }),
        ...new Array(100).fill({ id: 'id2', name: 'title2' }),
      ];
      expect(actual).toEqual(expected);
    });

    it('should query all documents with only one page', async () => {
      jest.spyOn(service, 'queryDocuments').mockResolvedValueOnce({
        total: 50,
        data: new Array(50).fill({ id: 'id1', name: 'title1' }),
        has_more: true,
        limit: 100,
        page: 1,
      });

      const actual = await service.queryAllDocuments('url', 'key', 'keyword');
      const expected = new Array(50).fill({ id: 'id1', name: 'title1' });
      expect(actual).toEqual(expected);
    });

    it('should throw an error when queryDocuments fails', async () => {
      jest.spyOn(service, 'queryDocuments').mockImplementation(() => {
        return Promise.reject(new Error('failed'));
      });

      await expect(
        service.queryAllDocuments('url', 'key', 'keyword'),
      ).rejects.toThrow('failed');
    });
  });
});
