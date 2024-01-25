import { Test, TestingModule } from '@nestjs/testing';
import * as path from 'path';
import { KbService } from '../../kb/kb.service';
import { KbResourceService } from '../resource.service';
import { KbSiteService } from '../../site/site.service';
import { KbFileService } from '../../file/file.service';
import { KbResourceController } from '../resource.controller';
import { I18nService } from 'nestjs-i18n';
import { ENUM_FILE_SOURCE_TYPES } from '../../base/constants';

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

      batchDeleteByIds: jest.fn().mockImplementation(() => true),
    } as any as KbFileService;

    KbServiceMock = {
      uploadDirName: '/tmp',
      getUploadFiles: jest.fn().mockImplementation(() => []),
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

      KbFileServiceMock.getFilePath = jest
        .fn()
        .mockImplementation((_res, originalname) => `/tmp/${originalname}`);

      KbFileServiceMock.findOrCreate = jest
        .fn()
        .mockImplementation((_, filePath) => ({
          filePath,
        }));

      const actual = await controller.uploadFiles(1, mockFiles, mockUser);
      const expected = mockFiles.map((file) => ({
        filePath: `${KbServiceMock.uploadDirName}/${file.originalname}`,
      }));
      expect(actual).toEqual(expected);
    });
  });

  describe('diskFiles', () => {
    it('should return files successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        roles: [],
      };
      const kbId = 1;
      const subDir = 'subDir';
      const isRecursion = true;

      KbServiceMock.findByPk = jest.fn().mockResolvedValue({
        id: kbId,
        title: 'title',
        ownerId: mockUser.id,
      });

      KbServiceMock.getKbRoot = jest.fn().mockReturnValue('/kbRoot');

      KbResourceServiceMock.checkDir = jest.fn().mockResolvedValue(true);

      KbServiceMock.getAllFiles = jest
        .fn()
        .mockResolvedValue([{ path: '/path1.txt' }, { path: '/path2.txt' }]);

      const result = await controller.diskFiles(
        kbId,
        mockUser,
        subDir,
        isRecursion,
      );

      expect(KbServiceMock.findByPk).toHaveBeenCalledWith(kbId);
      expect(KbServiceMock.getKbRoot).toHaveBeenCalledWith({
        id: kbId,
        title: 'title',
        ownerId: mockUser.id,
      });
      expect(KbResourceServiceMock.checkDir).toHaveBeenCalledWith('/kbRoot');
      expect(KbServiceMock.getAllFiles).toHaveBeenCalledWith(
        {
          id: kbId,
          title: 'title',
          ownerId: mockUser.id,
        },
        subDir,
        isRecursion,
        '/kbRoot',
      );
      expect(result).toEqual([{ path: '/path1.txt' }, { path: '/path2.txt' }]);
    });
  });

  describe('privewFile', () => {
    it('should throw an error if the file does not exist', async () => {
      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        roles: [],
      };
      const kbId = 1;
      const filePath = 'nonexistent.txt';

      KbServiceMock.findByPk = jest.fn().mockResolvedValue({
        id: kbId,
        title: 'title',
        ownerId: mockUser.id,
      });

      KbServiceMock.getKbRoot = jest.fn().mockReturnValue('/kbRoot');

      KbServiceMock.checkPathExist = jest.fn().mockResolvedValue(false);
      KbFileServiceMock.getFilePath = jest
        .fn()
        .mockResolvedValue('/kbRoot/nonexistent.txt');

      await expect(
        controller.privewFile(kbId, mockUser, {} as any, filePath),
      ).rejects.toThrow('not exist file');
    });

    it('should send the file if it exists', async () => {
      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        roles: [],
      };
      const kbId = 1;
      const filePath = 'existent.txt';

      KbServiceMock.findByPk = jest.fn().mockResolvedValue({
        id: kbId,
        title: 'title',
        ownerId: mockUser.id,
      });

      KbServiceMock.getKbRoot = jest.fn().mockReturnValue('/kbRoot');

      KbServiceMock.checkPathExist = jest.fn().mockResolvedValue(true);
      KbFileServiceMock.getFilePath = jest
        .fn()
        .mockImplementation(() => '/kbRoot/existent.txt');

      const res = {
        sendFile: jest.fn(),
      };

      await controller.privewFile(kbId, mockUser, res as any, filePath);

      expect(res.sendFile).toHaveBeenCalledWith('/kbRoot/existent.txt');
    });
  });

  describe('syncFilesToDb', () => {
    it('should sync files to db successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        roles: [],
      };
      const kbId = 1;
      await controller.syncFilesToDb(kbId, mockUser);

      expect(KbServiceMock.getUploadFiles).toHaveBeenCalledWith({
        id: kbId,
        ownerId: mockUser.id,
        title: 'title',
      });
    });
  });

  describe('_autoCreateOrDeleteFiles', () => {
    it('should create new files and delete non-existing files', async () => {
      const diskFiles = [{ path: '/path1.txt' }, { path: '/path2.txt' }] as any;
      const dbFiles = [
        { id: 1, filePath: '/path1.txt', fileExt: 'txt' },
        { id: 2, filePath: '/path3.txt', fileExt: 'txt' },
      ] as any;
      const kbId = 1;
      const userId = 1;
      const sourceType = ENUM_FILE_SOURCE_TYPES.UPLOAD;
      const siteId = 1;

      await (controller as any)._autoCreateOrDeleteFiles(
        diskFiles,
        dbFiles,
        kbId,
        userId,
        sourceType,
        siteId,
      );

      expect(KbFileServiceMock.batchCreate).toHaveBeenCalledWith(
        [{ filePath: '/path2.txt', fileExt: 'txt', siteId }],
        userId,
        kbId,
        sourceType,
      );
      expect(KbFileServiceMock.batchDeleteByIds).toHaveBeenCalledWith([2]);
    });
  });
});
