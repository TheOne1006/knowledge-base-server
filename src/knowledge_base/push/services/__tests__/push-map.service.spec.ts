import { SequelizeModule, getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import { PushMapService } from '../push-map.service';
import { PushMap } from '../../entites/push-map.entity';

import { DatabaseModule } from '../../../../core/database/database.module';
import { LoggerModule } from '../../../../core/logger/logger.module';

const defaultAttr = {
  configId: 1,
  type: 'xxx',
  pushVersion: 'init',
  ownerId: 1,
  kbId: 1,
  pushChecksum: 'sha256',
};

const mockBaseData = [
  {
    id: 1,
    fileId: 1,
    remoteId: 'id1',
    ...defaultAttr,
  },
  {
    id: 2,
    fileId: 2,
    remoteId: 'id2',
    ...defaultAttr,
  },
  {
    id: 3,
    fileId: 3,
    remoteId: 'id3',
    ...defaultAttr,
  },
  {
    id: 5,
    fileId: 5,
    remoteId: 'id5',
    ...defaultAttr,
  },
  {
    id: 6,
    fileId: 6,
    remoteId: 'id6',
    ...defaultAttr,
  },
  {
    id: 7,
    fileId: 7,
    remoteId: 'id7',
    ...defaultAttr,
  },
];

describe('PushMapService', () => {
  let service: PushMapService;
  let moduleRef: TestingModule;
  let sequelize: Sequelize;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule,
        DatabaseModule,
        SequelizeModule.forFeature([PushMap]),
      ],
      providers: [PushMapService],
    }).compile();
    sequelize = moduleRef.get(Sequelize);
    service = moduleRef.get<PushMapService>(PushMapService);

    const CurModel = moduleRef.get(getModelToken(PushMap));
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
        remoteId: 'idNext',
        configId: 2,
        fileId: 8,
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

    it('should return instances with args', async () => {
      const result = await service.findAll({}, 0, 10, ['id', 'desc']);
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

  describe('findOne', () => {
    it('should return a instances by its id', async () => {
      const id = 1;
      const result = await service.findOne({ id });
      expect(result).toBeDefined();
      expect(result.id).toEqual(1);
    });
  });

  describe('updateByPk', () => {
    it('should update a instances by its primary key', async () => {
      const pk = 1;
      const dto: any = { pushVersion: 'update' };
      const result = await service.updateByPk(pk, dto);
      expect(result).toBeDefined();
      expect(result.pushVersion).toEqual(dto.pushVersion);
    });

    it('should update a instances by its primary key', async () => {
      const pk = 100000;
      const dto: any = { pushVersion: 'update' };

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

  describe('batchDeleteByIds', () => {
    it('should delete instances by their ids', async () => {
      const ids = [6, 7];
      const result = await service.batchDeleteByIds(ids);
      expect(result).toEqual(ids);
      for (const id of ids) {
        const deletedInstance = await service.findByPk(id);
        expect(deletedInstance).toBeNull();
      }
    });

    it('should delete instances by empty ids', async () => {
      const ids = [];
      const result = await service.batchDeleteByIds(ids);
      expect(result).toEqual([]);
    });
  });
});
