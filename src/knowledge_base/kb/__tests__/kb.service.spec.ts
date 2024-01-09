import { SequelizeModule, getModelToken } from '@nestjs/sequelize';
import * as path from 'path';
import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import { KbService } from '../kb.service';
import { CreateKbDto, UpdateKbDto, KbDto } from '../dtos';
import { KnowledgeBase } from '../kb.entity';

// import { CoreModule } from '../../../core/core.module';
import { config } from '../../../../config';

const RESOURCES_ROOT = config.APP_CONFIG.KOWNLEDGE_BASE_RESOURCES_ROOT;
import { DatabaseModule } from '../../../core/database/database.module';
import { LoggerModule } from '../../../core/logger/logger.module';

const mockKnowledgeBaseData = [
  {
    id: 1,
    title: 'demo1',
    desc: 'desc1',
    ownerId: 1,
  },
  {
    id: 2,
    title: 'demo2',
    desc: 'desc2',
    ownerId: 1,
  },
  {
    id: 3,
    title: 'demo-delete',
    desc: 'desc3',
    ownerId: 1,
  },
  {
    id: 5,
    title: 'demo3-update',
    desc: 'desc3',
    ownerId: 1,
  },
];

describe('KbService', () => {
  let service: KbService;
  let moduleRef: TestingModule;
  let sequelize: Sequelize;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule,
        DatabaseModule,
        SequelizeModule.forFeature([KnowledgeBase]),
      ],
      providers: [KbService],
    }).compile();
    sequelize = moduleRef.get(Sequelize);
    service = moduleRef.get<KbService>(KbService);

    const CurModel = moduleRef.get(getModelToken(KnowledgeBase));
    await CurModel.truncate();

    try {
      await CurModel.bulkCreate(mockKnowledgeBaseData);
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
    it('should create a new knowledge base', async () => {
      const dto: CreateKbDto = {
        title: 'title',
        desc: 'desc',
      };
      const ownerId = 1;
      const result = await service.create(dto, ownerId);
      expect(result).toBeDefined();
      // 最后一个元素
      const last = mockKnowledgeBaseData[mockKnowledgeBaseData.length - 1];
      expect(result.id).toBeGreaterThan(last.id);
    });
  });

  describe('findAll', () => {
    it('should return all knowledge bases', async () => {
      const result = await service.findAll();
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(2);
    });
  });

  describe('findByPk', () => {
    it('should return a knowledge base by its primary key', async () => {
      const id = 1;
      const result = await service.findByPk(id);
      expect(result).toBeDefined();
      expect(result.id).toEqual(1);
    });
  });

  describe('updateByPk', () => {
    it('should update a knowledge base by its primary key', async () => {
      const pk = 5;
      const dto: UpdateKbDto = { desc: 'update' };
      const result = await service.updateByPk(pk, dto);
      expect(result).toBeDefined();
      expect(result.desc).toEqual(dto.desc);
    });

    it('should update a knowledge base by its primary key', async () => {
      const pk = 100000;
      const dto: UpdateKbDto = { desc: 'update' };

      // 检测报错
      await expect(service.updateByPk(pk, dto)).rejects.toThrow(
        'instance not found',
      );
    });
  });

  describe('removeByPk', () => {
    it('should remove a knowledge base by its primary key', async () => {
      const id = 3;
      const result = await service.removeByPk(id);
      expect(result).toBeDefined();
      const deleteResult = await service.findByPk(id);
      expect(deleteResult).toBeNull();
    });
  });

  describe('getKbRoot', () => {
    it('should get the root of a knowledge base', () => {
      const kb = { title: 'title', ownerId: 1 } as KbDto;
      const result = service.getKbRoot(kb);
      const expected = `${RESOURCES_ROOT}/1/title`;
      expect(result).toEqual(expected);
      // Add more assertions based on your business logic
    });
  });

  describe('getAllFiles', () => {
    beforeAll(() => {
      jest
        .spyOn(service, 'getKbRoot')
        .mockImplementation(() => path.join(__dirname, '_mock_file'));
    });

    it('should get all files of a knowledge base with isRecursion', async () => {
      const kb = { title: 'title', ownerId: 1 } as KbDto;

      const result = await service.getAllFiles(kb);
      // console.log(result[0].children);

      const expected = [
        {
          name: '_mock1',
          path: path.join(__dirname, '_mock_file/_mock1'),
          isDir: true,
          children: [
            {
              name: 'mock2.txt',
              path: path.join(__dirname, '_mock_file', '_mock1', 'mock2.txt'),
              isDir: false,
            },
          ],
        },
        {
          name: 'mock1.txt',
          path: path.join(__dirname, '_mock_file/mock1.txt'),
          isDir: false,
        },
      ];

      expect(result).toEqual(expected);
    });

    it('should get all files of a knowledge base with subDir', async () => {
      const kb = { title: 'title', ownerId: 1 } as KbDto;

      const result = await service.getAllFiles(kb, '_mock1');
      // console.log(result[0].children);

      const expected = [
        {
          name: 'mock2.txt',
          path: path.join(__dirname, '_mock_file', '_mock1', 'mock2.txt'),
          isDir: false,
        },
      ];

      expect(result).toEqual(expected);
    });

    it('should get all files of a knowledge base without isRecursion', async () => {
      const kb = { title: 'title', ownerId: 1 } as KbDto;
      const result = await service.getAllFiles(kb, '', false);
      const expected = [
        {
          name: 'mock2.txt',
          path: path.join(__dirname, '_mock_file', '_mock1', 'mock2.txt'),
          isDir: false,
        },
        {
          name: 'mock1.txt',
          path: path.join(__dirname, '_mock_file/mock1.txt'),
          isDir: false,
        },
      ];
      expect(result).toEqual(expected);
    });
  });

  describe('checkDir', () => {
    it('should check if a directory exists and create it if it does not', async () => {
      const dirPath = path.join(__dirname, '_mock_file');
      const result = await service.checkDir(dirPath);
      expect(result).toBeTruthy();
    });
  });
});
