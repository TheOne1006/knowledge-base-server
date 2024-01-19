import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PushDifyService } from '../dify.service';
import { of } from 'rxjs';

describe('PushDifyService', () => {
  let service: PushDifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushDifyService,
        {
          provide: HttpService,
          useValue: {
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
          },
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PushDifyService>(PushDifyService);
    // httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a document', async () => {
    const actual = await service.createByFile('url', 'path', 'key');
    const expected = {
      id: 'id1',
      name: 'title1',
    };
    expect(actual).toEqual(expected);
  });

  it('should delete a document', async () => {
    const actual = await service.deleteByFile('url', 'id', 'key');
    const expected = 'success';
    expect(actual).toEqual(expected);
  });

  it('should update a document', async () => {
    const actual = await service.updateByFile('url', 'id', 'path', 'key');
    const expected = {
      id: 'id1',
      name: 'title1',
    };
    expect(actual).toEqual(expected);
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
