import { SequelizeModule, getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import { PushConfigService } from '../push-config.service';
// import { CreateKbDto, UpdateKbDto, KbDto } from '../dtos';
import { PushConfig } from '../../entites/push-config.entity';

import { DatabaseModule } from '../../../../core/database/database.module';
import { LoggerModule } from '../../../../core/logger/logger.module';

const defaultAttr = {
  desc: 'desc1',
  type: 'dify',
  apiKey: 'xxx',
  apiUrl: 'http://local.com',
  ownerId: 1,
  kbId: 1,
};

const mockBaseData = [
  {
    id: 1,
    title: 'demo1',
    ...defaultAttr,
  },
  {
    id: 2,
    title: 'demo2',
    ...defaultAttr,
  },
  {
    id: 3,
    title: 'demo3',
    ...defaultAttr,
  },
  {
    id: 5,
    title: 'demo5',
    ...defaultAttr,
  },
];

describe('PushConfigService', () => {
  let service: PushConfigService;
  let moduleRef: TestingModule;
  let sequelize: Sequelize;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule,
        DatabaseModule,
        SequelizeModule.forFeature([PushConfig]),
      ],
      providers: [PushConfigService],
    }).compile();
    sequelize = moduleRef.get(Sequelize);
    service = moduleRef.get<PushConfigService>(PushConfigService);

    const CurModel = moduleRef.get(getModelToken(PushConfig));
    await CurModel.truncate();

    try {
      await CurModel.bulkCreate(mockBaseData);
    } catch (error) {
      console.error(error);
    }
  });

  afterAll(async () => {
    // 关闭数据库连接
    await sequelize.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new instance', async () => {
      const dto: any = {
        title: 'new',
        desc: 'desc',
        ...defaultAttr,
      };
      const kbId = 1;
      const ownerId = 1;
      const result = await service.create(dto, kbId, ownerId);
      expect(result).toBeDefined();
      // 最后一个元素
      const last = mockBaseData[mockBaseData.length - 1];
      expect(result.id).toBeGreaterThan(last.id);
    });
  });

  describe('findAll', () => {
    it('should return all instances', async () => {
      const result = await service.findAll();
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(2);
    });
  });

  describe('findByPk', () => {
    it('should return a instances by its primary key', async () => {
      const id = 1;
      const result = await service.findByPk(id);
      expect(result).toBeDefined();
      expect(result.id).toEqual(1);
    });
  });

  describe('updateByPk', () => {
    it('should update a instances by its primary key', async () => {
      const pk = 1;
      const dto: any = { desc: 'update' };
      const result = await service.updateByPk(pk, dto);
      expect(result).toBeDefined();
      expect(result.desc).toEqual(dto.desc);
    });

    it('should update a instances by its primary key', async () => {
      const pk = 100000;
      const dto: any = { desc: 'update' };

      // 检测报错
      await expect(service.updateByPk(pk, dto)).rejects.toThrow(
        'instance not found',
      );
    });
  });

  describe('removeByPk', () => {
    it('should remove a instance by its primary key', async () => {
      const id = 3;
      const result = await service.removeByPk(id);
      expect(result).toBeDefined();
      const deleteResult = await service.findByPk(id);
      expect(deleteResult).toBeNull();
    });
  });
});
