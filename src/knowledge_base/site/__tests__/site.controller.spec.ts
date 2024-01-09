import { Test, TestingModule } from '@nestjs/testing';
import { KbSiteController } from '../site.controller';
import { KbSiteService } from '../site.service';
import { KbService } from '../../kb/kb.service';
import { I18nService } from 'nestjs-i18n';

describe('KbController', () => {
  let moduleRef: TestingModule;
  let controller: KbSiteController;
  let KbSiteServiceMock: KbSiteService;
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

    KbSiteServiceMock = {
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
      updateByPk: jest.fn().mockResolvedValue({
        id: 1,
        title: 'title',
        desc: 'desc',
      }),
      removeByPk: jest.fn().mockResolvedValue({
        id: 1,
        title: 'title',
        desc: 'desc',
      }),
      getKbSiteRoot: jest.fn().mockResolvedValue('/tmp'),
      checkDir: jest.fn().mockResolvedValue(true),
      removeDir: jest.fn().mockResolvedValue(true),
    } as any as KbSiteService;
    moduleRef = await Test.createTestingModule({
      controllers: [KbSiteController],
      providers: [
        {
          provide: KbSiteService,
          useValue: KbSiteServiceMock,
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

    controller = moduleRef.get<KbSiteController>(KbSiteController);
    (controller as any).check_owner = jest.fn().mockImplementation(() => true);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('READ', () => {
    it('adminlist', async () => {
      const actual = await controller.adminlist(1, 1, 1, 1);
      expect(actual.length).toBeGreaterThan(1);
    });

    it('adminlist with out ownerId', async () => {
      const actual = await controller.adminlist(undefined, undefined, 1, 1);
      expect(actual.length).toBeGreaterThan(1);
    });

    it('ownerlist', async () => {
      const user = {
        id: 1,
        username: 'user',
        email: '',
        roles: [],
      };
      const actual = await controller.ownerlist(1, 1, 1, user);

      expect(actual.length).toBeGreaterThan(1);
    });

    it('ownerlist without kbId', async () => {
      const user = {
        id: 1,
        username: 'user',
        email: '',
        roles: [],
      };
      const actual = await controller.ownerlist(undefined, 1, 1, user);

      expect(actual.length).toBeGreaterThan(1);
    });

    describe('count', () => {
      it('should return count when ownerId/kbId is provided', async () => {
        const ownerId = 1;
        const kbId = 1;
        const count = 5;

        const actual = await controller.count(ownerId, kbId);

        expect(KbSiteServiceMock.count).toHaveBeenCalledWith({ ownerId, kbId });
        expect(actual).toEqual({ count });
      });

      it('should return count when ownerId/kbId is not provided', async () => {
        const count = 5;

        const actual = await controller.count(undefined, undefined);

        expect(KbSiteServiceMock.count).toHaveBeenCalledWith({});
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

  describe('CREATE', () => {
    describe('create', () => {
      it('should return created instance', async () => {
        const user = {
          id: 1,
          username: 'user',
          email: '',
          roles: [],
        };
        const newInfo = {
          title: 'title',
          desc: 'title',
          hostname: 'http://xxx.com/',
          startUrls: ['/start'],
          pattern: 'http',
          removeSelectors: [],
        };
        const kbId = 1;

        const actual = await controller.create(kbId, newInfo, user);

        expect(KbSiteServiceMock.create).toHaveBeenCalledWith(
          newInfo,
          kbId,
          user.id,
        );
        const expected = {
          id: 1,
          title: 'title',
          desc: 'desc',
        };
        expect(actual).toEqual(expected);
      });
    });
  });

  describe('UPDATE', () => {
    describe('updateByPk', () => {
      it('should return update kb', async () => {
        const user = {
          id: 1,
          username: 'user',
          email: '',
          roles: [],
        };

        const updateKb = {
          desc: 'title',
          hostname: 'http://xxx.com/',
          startUrls: ['/start'],
          pattern: 'http',
          removeSelectors: [],
        };

        const actual = await controller.updateByPk(1, updateKb, user);

        expect(KbSiteServiceMock.updateByPk).toHaveBeenCalledWith(1, updateKb);
        const expected = {
          id: 1,
          title: 'title',
          desc: 'desc',
        };
        expect(actual).toEqual(expected);
      });
    });
  });

  describe('DELETE', () => {
    describe('deleteByPk', () => {
      it('should return deleted instance', async () => {
        const user = {
          id: 1,
          username: 'user',
          email: '',
          roles: [],
        };

        const actual = await controller.deleteByPk(1, user);

        expect(KbSiteServiceMock.removeByPk).toHaveBeenCalledWith(1);
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
