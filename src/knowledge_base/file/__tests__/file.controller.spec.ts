import { Test, TestingModule } from '@nestjs/testing';
import { KbFileController } from '../file.controller';
import { KbService } from '../../kb/kb.service';
import { KbFileService } from '../file.service';
import { I18nService } from 'nestjs-i18n';

describe('KbController', () => {
  let moduleRef: TestingModule;
  let controller: KbFileController;
  let KbFileServiceMock: KbFileService;
  let KbServiceMock: KbService;
  let I18nServiceMock: I18nService;

  beforeEach(async () => {
    I18nServiceMock = {
      t: jest.fn().mockImplementation((key) => key),
    } as any as I18nService;

    KbServiceMock = {
      findByPk: jest.fn().mockResolvedValue({
        id: 1,
        title: 'title',
      }),
      getKbRoot: jest.fn().mockResolvedValue('/tmp'),
    } as any as KbService;

    KbFileServiceMock = {
      findAll: jest.fn().mockResolvedValue([
        { id: 1, title: 'title' },
        { id: 2, title: 'title2' },
      ]),
      count: jest.fn().mockResolvedValue(5),
      findByPk: jest.fn().mockResolvedValue({
        id: 1,
        title: 'title',
      }),
      create: jest.fn().mockResolvedValue({
        id: 1,
        title: 'title',
        desc: 'desc',
      }),
      removeByPk: jest.fn().mockResolvedValue({
        id: 1,
        title: 'title',
        desc: 'desc',
      }),
      getFilePath: jest.fn().mockResolvedValue('/tmp'),
      checkDir: jest.fn().mockResolvedValue(true),
      checkPathExist: jest.fn().mockResolvedValue(true),
      removeDir: jest.fn().mockResolvedValue(true),
      removeFile: jest.fn().mockResolvedValue(true),
    } as any as KbFileService;
    moduleRef = await Test.createTestingModule({
      controllers: [KbFileController],
      providers: [
        {
          provide: KbFileService,
          useValue: KbFileServiceMock,
        },
        {
          provide: KbService,
          useValue: KbServiceMock,
        },
        {
          provide: I18nService,
          useValue: I18nServiceMock,
        },
      ],
    }).compile();

    controller = moduleRef.get<KbFileController>(KbFileController);
    (controller as any).check_owner = jest.fn().mockImplementation(() => true);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('READ', () => {
    it('adminlist with kbId', async () => {
      const actual = await controller.adminlist(1, 1, 1);
      expect(actual.length).toBeGreaterThan(1);
    });

    it('adminlist with out kbId', async () => {
      const actual = await controller.adminlist(undefined, 1, 1);
      expect(actual.length).toBeGreaterThan(1);
    });

    it('ownerlist', async () => {
      const user = {
        id: 1,
        username: 'user',
        email: '',
        roles: [],
      };

      const mockRes = {
        set: jest.fn(),
      } as any;

      const actual = await controller.ownerlist(mockRes, user, 1, 1);

      expect(actual.length).toBeGreaterThan(1);
    });

    it('ownerlist without kbId', async () => {
      const user = {
        id: 1,
        username: 'user',
        email: '',
        roles: [],
      };
      const mockRes = {
        set: jest.fn(),
      } as any;
      const actual = await controller.ownerlist(mockRes, user, undefined, 1);

      expect(actual.length).toBeGreaterThan(1);
    });

    describe('count', () => {
      it('should return count when ownerId/kbId is provided', async () => {
        const ownerId = 1;
        const kbId = 1;
        const count = 5;

        const actual = await controller.count(ownerId, kbId);

        expect(KbFileServiceMock.count).toHaveBeenCalledWith({ ownerId, kbId });
        expect(actual).toEqual({ count });
      });

      it('should return count when ownerId/kbId is not provided', async () => {
        const count = 5;

        const actual = await controller.count(undefined, undefined);

        expect(KbFileServiceMock.count).toHaveBeenCalledWith({});
        expect(actual).toEqual({ count });
      });
    });

    it('findByPk', async () => {
      const user = {
        id: 1,
        username: 'user',
        email: '',
        roles: [],
      };
      const actual = await controller.findByPk(1, user);
      expect(actual).toEqual({
        id: 1,
        title: 'title',
      });
    });
  });

  describe('DELETE', () => {
    describe('deleteByPk', () => {
      it('should return deleted instance without removeFile', async () => {
        const user = {
          id: 1,
          username: 'user',
          email: '',
          roles: [],
        };

        KbFileServiceMock.checkPathExist = jest.fn().mockResolvedValue(false);
        const actual = await controller.deleteByPk(1, user);

        // 没有调用过
        expect(KbFileServiceMock.removeFile).not.toHaveBeenCalled();
        expect(KbFileServiceMock.removeByPk).toHaveBeenCalledWith(1);
        const expected = {
          id: 1,
          title: 'title',
          desc: 'desc',
        };
        expect(actual).toEqual(expected);
      });

      it('should return deleted instance success', async () => {
        const user = {
          id: 1,
          username: 'user',
          email: '',
          roles: [],
        };

        const actual = await controller.deleteByPk(1, user);

        expect(KbFileServiceMock.removeByPk).toHaveBeenCalledWith(1);
        expect(KbFileServiceMock.removeFile).toHaveBeenCalled();
        const expected = {
          id: 1,
          title: 'title',
          desc: 'desc',
        };
        expect(actual).toEqual(expected);
      });
    });
  });
});
