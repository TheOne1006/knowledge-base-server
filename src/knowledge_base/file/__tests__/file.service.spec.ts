import { SequelizeModule, getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import { KbFileService } from '../file.service';
import { KnowledgeBaseFile } from '../file.entity';

import { DatabaseModule } from '../../../core/database/database.module';
import { LoggerModule } from '../../../core/logger/logger.module';

const defaultAttr = {
  fileExt: 'html',
  ownerId: 1,
  kbId: 1,
};

const mockData = [
  {
    ...defaultAttr,
    filePath: '/xxx/path/to/file.html',
    id: 1,
  },
  {
    ...defaultAttr,
    filePath: '/xxx/path/to/file2.html',
    id: 2,
  },
  {
    ...defaultAttr,
    filePath: '/xxx/path/to/file3.html',
    id: 3,
  },
  {
    ...defaultAttr,
    filePath: '/xxx/path/to/file5.html',
    id: 5,
  },
];

describe('KbFileService', () => {
  let service: KbFileService;
  let moduleRef: TestingModule;
  let sequelize: Sequelize;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule,
        DatabaseModule,
        SequelizeModule.forFeature([KnowledgeBaseFile]),
      ],
      providers: [KbFileService],
    }).compile();
    sequelize = moduleRef.get(Sequelize);
    service = moduleRef.get<KbFileService>(KbFileService);

    const CurModel = moduleRef.get(getModelToken(KnowledgeBaseFile));
    await CurModel.truncate();

    try {
      await CurModel.bulkCreate(mockData);
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

  describe('DB operation', () => {
    describe('CREATE', () => {
      it('should create a new instance', async () => {
        const dto = {
          filePath: '/tmp/path/to/file.txt',
          fileExt: 'txt',
        };
        const ownerId = 1;
        const kId = 1;
        const result = await service.create(dto, kId, ownerId);
        expect(result).toBeDefined();
        // 最后一个元素
        const last = mockData[mockData.length - 1];
        expect(result.id).toBeGreaterThan(last.id);
      });
    });

    describe('BATCH CREATE', () => {
      it('should create a new instance', async () => {
        const dtos = [
          {
            filePath: '/tmp/path/to/file.txt',
            fileExt: 'txt',
          },
          {
            filePath: '/tmp/path/to/file2.txt',
            fileExt: 'txt',
          },
        ];
        const ownerId = 1;
        const kId = 1;
        const result = await service.batchCreate(dtos, kId, ownerId);
        expect(result).toBeDefined();
        // 最后一个元素
        const last = mockData[mockData.length - 1];
        expect(result[0].id).toBeGreaterThan(last.id);
      });
    });

    describe('findAll', () => {
      it('should return all instance', async () => {
        const result = await service.findAll();
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(2);
      });

      it('should return all instance', async () => {
        const result = await service.findAll(undefined, 1, 2);
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(1);
      });
    });

    describe('findByPk', () => {
      it('should return a instance by its primary key', async () => {
        const id = 1;
        const result = await service.findByPk(id);
        expect(result).toBeDefined();
        expect(result.id).toEqual(1);
      });
    });

    describe.skip('updateByPk', () => {
      // it('should update a instance by its primary key', async () => {
      //   const pk = 3;
      //   const dto = {
      //     ...defaultAttr,
      //     desc: 'update',
      //   };
      //   const result = await service.updateByPk(pk, dto);
      //   expect(result).toBeDefined();
      //   expect(result.desc).toEqual(dto.desc);
      // });
      // it('should update a instance by error primary key', async () => {
      //   const pk = 100000;
      //   const dto = {
      //     ...defaultAttr,
      //     desc: 'update',
      //   };

      //   // 检测报错
      //   await expect(service.updateByPk(pk, dto)).rejects.toThrow(
      //     'instance not found',
      //   );
      // });
    });

    describe('removeByPk', () => {
      it('should remove a instance by its primary key', async () => {
        const id = 2;
        const result = await service.removeByPk(id);
        expect(result).toBeDefined();
        const deleteResult = await service.findByPk(id);
        expect(deleteResult).toBeNull();
      });
    });
  });
});
