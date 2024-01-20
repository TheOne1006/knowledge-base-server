import { Test, TestingModule } from '@nestjs/testing';
import { PushConfigController } from '../push-config.controller';
import { PushConfigService } from '../../services/push-config.service';
import { I18nService } from 'nestjs-i18n';
import { KbService } from '../../../kb/kb.service';

describe('PushConfigController', () => {
  let controller: PushConfigController;
  const mockPushConfigService = {
    findAll: jest.fn().mockResolvedValue([]),
    findByPk: jest.fn().mockResolvedValue({ ownerId: 1 }),
    create: jest.fn().mockResolvedValue({}),
    updateByPk: jest.fn().mockResolvedValue({}),
    removeByPk: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  };
  const mockKbService = {
    findByPk: jest.fn().mockResolvedValue({ ownerId: 1 }),
  };

  beforeEach(async () => {
    const I18nServiceMock = {
      t: jest.fn().mockReturnValue('error.INS_NOT_OWNER'),
    } as any as I18nService;
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushConfigController],
      providers: [
        { provide: PushConfigService, useValue: mockPushConfigService },
        { provide: KbService, useValue: mockKbService },
        {
          provide: I18nService,
          useValue: I18nServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PushConfigController>(PushConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get admin list', async () => {
    expect(await controller.adminlist(1, 1, 1, 10)).toEqual([]);
  });

  it('should get owner list', async () => {
    expect(await controller.ownerlist(1, 1, 10, { id: 1 } as any)).toEqual([]);
  });

  it('should get count', async () => {
    expect(await controller.count(1, 1)).toEqual({ count: 0 });
  });

  it('should find by pk', async () => {
    expect(await controller.findByPk(1, { id: 1 } as any)).toEqual({
      ownerId: 1,
    });
  });

  it('should create', async () => {
    expect(
      await controller.create(1, { title: 't1' } as any, { id: 1 } as any),
    ).toEqual({});
  });

  it('should update by pk', async () => {
    expect(
      await controller.updateByPk(1, { title: 't1' } as any, { id: 1 } as any),
    ).toEqual({});
  });

  it('should delete by pk', async () => {
    expect(await controller.deleteByPk(1, { id: 1 } as any)).toEqual({});
  });
});
