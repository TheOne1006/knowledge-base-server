import { I18nService } from 'nestjs-i18n';
import { Test, TestingModule } from '@nestjs/testing';

import type { Response } from 'express';
import { ExpressResponse } from '../../../../common/decorators/express-res.decorator';

import { PushLogController } from '../push-log.controller';
import { PushLogService } from '../../services/push-log.service';

describe('PushLogController', () => {
  let controller: PushLogController;
  let mockRes: Response;
  const mockPushLogService = {
    findAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findByPk: jest.fn().mockResolvedValue({ ownerId: 1 }),
  };

  beforeEach(async () => {
    mockRes = {
      json: jest.fn(),
      set: jest.fn(),
    } as any as Response;

    const I18nServiceMock = {
      t: jest.fn().mockReturnValue('error.INS_NOT_OWNER'),
    } as any as I18nService;
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushLogController],
      providers: [
        { provide: PushLogService, useValue: mockPushLogService },
        {
          provide: I18nService,
          useValue: I18nServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PushLogController>(PushLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get admin list', async () => {
    expect(await controller.adminlist(1, 1, 1, 10, 10)).toEqual([]);
  });

  it('should get owner list', async () => {
    const owner = { id: 1 } as any;
    const mockRes = {
      set: jest.fn(),
    } as any;
    expect(await controller.ownerlist(mockRes, owner, 1, 1)).toEqual([]);
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
