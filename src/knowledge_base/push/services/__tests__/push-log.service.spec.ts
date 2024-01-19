import { SequelizeModule, getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import { PushLogService } from '../push-log.service';
import { PushLog } from '../../entites/push-log.entity';

import { DatabaseModule } from '../../../../core/database/database.module';
import { LoggerModule } from '../../../../core/logger/logger.module';

const defaultAttr = {
  configId: 1,
  type: 'xxx',
  status: 'waiting',
  pushVersion: 'init',
  ownerId: 1,
  kbId: 1,
};

const mockBaseData = [
  {
    id: 1,
    ...defaultAttr,
  },
  {
    id: 2,
    ...defaultAttr,
  },
  {
    id: 3,
    ...defaultAttr,
  },
  {
    id: 5,
    ...defaultAttr,
  },
];

describe('PushLogService', () => {
  let service: PushLogService;
  let moduleRef: TestingModule;
  let sequelize: Sequelize;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule,
        DatabaseModule,
        SequelizeModule.forFeature([PushLog]),
      ],
      providers: [PushLogService],
    }).compile();
    sequelize = moduleRef.get(Sequelize);
    service = moduleRef.get<PushLogService>(PushLogService);

    const CurModel = moduleRef.get(getModelToken(PushLog));
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

  describe('findLastOne', () => {
    it('should return a instances by its primary key', async () => {
      const id = 1;
      const result = await service.findLastOne({ id });
      expect(result).toBeDefined();
      expect(result.id).toEqual(1);
    });
  });

  describe('updateByPk', () => {
    it('should update a instances', async () => {
      // 检测报错
      await expect(service.updateByPk()).rejects.toThrow('Method not Allow.');
    });
  });

  describe('removeByPk', () => {
    it('should remove a instance by its primary key', async () => {
      // 检测报错
      await expect(service.removeByPk()).rejects.toThrow('Method not Allow.');
    });
  });
});
