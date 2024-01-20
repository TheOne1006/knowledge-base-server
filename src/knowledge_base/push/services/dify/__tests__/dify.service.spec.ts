import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PushDifyService } from '../dify.service';
import { of, throwError } from 'rxjs';

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
    await expect(service.createByFile('url', 'path', 'key')).rejects.toThrow(
      'failed',
    );
  });

  it('should create a document', async () => {
    const actual = await service.createByFile('url', 'path', 'key');
    const expected = {
      id: 'id1',
      name: 'title1',
    };
    expect(actual).toEqual(expected);
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
    await expect(service.deleteByFile('url', 'path', 'key')).rejects.toThrow(
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
      service.updateByFile('url', 'id', 'path', 'key'),
    ).rejects.toThrow('failed');
  });

  it('should update a document', async () => {
    const actual = await service.updateByFile('url', 'id', 'path', 'key');
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
});
