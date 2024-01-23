import { I18nService } from 'nestjs-i18n';
import { Test, TestingModule } from '@nestjs/testing';
import { PushMapController } from '../push-map.controller';
import { PushMapService } from '../../services/push-map.service';

describe('PushMapController', () => {
  let controller: PushMapController;
  const mockPushMapService = {
    findAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findByPk: jest.fn().mockResolvedValue({ ownerId: 1 }),
  };

  beforeEach(async () => {
    const I18nServiceMock = {
      t: jest.fn().mockReturnValue('error.INS_NOT_OWNER'),
    } as any as I18nService;
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushMapController],
      providers: [
        { provide: PushMapService, useValue: mockPushMapService },
        {
          provide: I18nService,
          useValue: I18nServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PushMapController>(PushMapController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get admin list', async () => {
    expect(await controller.adminlist(1, 1, 1, 10, 10)).toEqual([]);
  });

  it('should get owner list', async () => {
    const mockRes = {
      set: jest.fn(),
    } as any;
    const user = {
      id: 1,
      username: 'user',
      email: '',
      roles: [],
    };
    const actual = await controller.ownerlist(mockRes, user, 1, 1);

    expect(actual).toEqual([]);
  });

  it('should get count', async () => {
    expect(await controller.count(1, 1, 1)).toEqual({ count: 0 });
  });

  it('should find by pk', async () => {
    expect(await controller.findByPk(1, { id: 1 } as any)).toEqual({
      ownerId: 1,
    });
  });
});
