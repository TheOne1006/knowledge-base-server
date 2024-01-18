import { Test, TestingModule } from '@nestjs/testing';
import * as path from 'path';
import { KbService } from '../../kb/kb.service';
import { KbResourceService } from '../resource.service';
import { KbSiteService } from '../../site/site.service';
import { KbFileService } from '../../file/file.service';
import { KbResourceController } from '../resource.controller';
import { I18nService } from 'nestjs-i18n';
// import { Logger } from 'winston';

describe('KbResourceController', () => {
  let KbServiceMock: KbService;
  let KbResourceServiceMock: KbResourceService;
  let KbSiteServiceMock: KbSiteService;
  let KbFileServiceMock: KbFileService;
  let controller: KbResourceController;

  beforeEach(async () => {
    const I18nServiceMock = {} as any as I18nService;
    KbResourceServiceMock = {
      checkDir: jest.fn().mockImplementation(() => true),
    } as any as KbResourceService;
    KbSiteServiceMock = {
      findAll: jest.fn().mockImplementation(() => [
        {
          id: 1,
          title: 'title',
          ownerId: 1,
        },
      ]),
    } as any as KbSiteService;
    KbFileServiceMock = {
      batchCreate: jest.fn().mockImplementation(() => [
        {
          id: 1,
          title: 'title',
          ownerId: 1,
        },
        {
          id: 2,
          title: 'title',
          ownerId: 1,
        },
      ]),
      findAll: jest.fn().mockImplementation(() => [
        {
          id: 1,
          title: 'title',
          ownerId: 1,
        },
      ]),
    } as any as KbFileService;

    KbServiceMock = {
      getKbUploadRoot: jest.fn().mockImplementation(() => '/tmp'),
      findByPk: jest.fn().mockImplementation(() => ({
        id: 1,
        title: 'title',
        ownerId: 1,
      })),
      getKbRoot: jest
        .fn()
        .mockImplementation(() =>
          path.join(__dirname, 'mock_files', 'resource_crontroller'),
        ),
      getAllFiles: jest
        .fn()
        .mockImplementation(() => ['/path', '/path1', '/path2']),
    } as any as KbService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KbResourceController],
      providers: [
        {
          provide: KbService,
          useValue: KbServiceMock,
        },
        {
          provide: KbResourceService,
          useValue: KbResourceServiceMock,
        },
        {
          provide: KbSiteService,
          useValue: KbSiteServiceMock,
        },
        {
          provide: KbFileService,
          useValue: KbFileServiceMock,
        },
        {
          provide: I18nService,
          useValue: I18nServiceMock,
        },
      ],
    }).compile();

    controller = module.get<KbResourceController>(KbResourceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFiles', () => {
    it('should upload files successfully', async () => {
      const mockFiles: Express.Multer.File[] = [
        {
          originalname: 'test.txt',
          buffer: Buffer.from('test content'),
        } as Express.Multer.File,
        {
          originalname: 'test2.txt',
          buffer: Buffer.from('test2 content'),
        } as Express.Multer.File,
      ];
      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        roles: [],
      };
      const result = await controller.uploadFiles(1, mockFiles, mockUser);
      const expected = mockFiles.map((file) => file.originalname);
      expect(result).toEqual(expected);
    });
  });
});
