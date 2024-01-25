import { SequelizeModule, getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import { KbSiteService } from '../site.service';
import { KnowledgeBaseSite } from '../site.entity';

import { DatabaseModule } from '../../../core/database/database.module';
import { LoggerModule } from '../../../core/logger/logger.module';

const defaultAttr = {
  desc: 'desc',
  hostname: 'http://www.example.com/',
  startUrls: ['/', '/start'],
  removeSelectors: [],
  matchPatterns: ['http'],
  ignorePatterns: [],
  ownerId: 1,
  kbId: 1,
};

const mockData = [
  {
    ...defaultAttr,
    title: 't1',
    id: 1,
  },
  {
    ...defaultAttr,
    title: 't2',
    id: 2,
  },
  {
    ...defaultAttr,
    title: 't3',
    id: 3,
  },
  {
    ...defaultAttr,
    title: 't5',
    id: 5,
  },
];

describe('KbSiteService', () => {
  let service: KbSiteService;
  let moduleRef: TestingModule;
  let sequelize: Sequelize;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule,
        DatabaseModule,
        SequelizeModule.forFeature([KnowledgeBaseSite]),
      ],
      providers: [KbSiteService],
    }).compile();
    sequelize = moduleRef.get(Sequelize);
    service = moduleRef.get<KbSiteService>(KbSiteService);

    const CurModel = moduleRef.get(getModelToken(KnowledgeBaseSite));
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
    describe('create', () => {
      it('should create a new instance', async () => {
        const dto = {
          title: 'title',
          desc: 'desc',
          hostname: 'http://www.s.com',
          startUrls: ['/'],
          matchPatterns: ['http'],
          ignorePatterns: [],
          removeSelectors: [],
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

    describe('findAll', () => {
      it('should return all instance', async () => {
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
      it('should return a instance by its primary key', async () => {
        const id = 1;
        const result = await service.findByPk(id);
        expect(result).toBeDefined();
        expect(result.id).toEqual(1);
      });
    });

    describe('updateByPk', () => {
      it('should update a instance by its primary key', async () => {
        const pk = 3;
        const dto = {
          ...defaultAttr,
          desc: 'update',
        };
        const result = await service.updateByPk(pk, dto);
        expect(result).toBeDefined();
        expect(result.desc).toEqual(dto.desc);
      });

      it('should update a instance by error primary key', async () => {
        const pk = 100000;
        const dto = {
          ...defaultAttr,
          desc: 'update',
        };

        // 检测报错
        await expect(service.updateByPk(pk, dto)).rejects.toThrow(
          'instance not found',
        );
      });
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

  describe('file operation', () => {
    describe('getKbSiteRoot', () => {
      it('should get the root of a instance site', () => {
        const site = { title: 'title', ownerId: 1 } as any;
        const result = service.getKbSiteRoot('/tmp', site);
        const expected = `/tmp/title`;
        expect(result).toEqual(expected);
        // Add more assertions based on your business logic
      });
    });
    describe('getFullStartUrls', () => {
      it('should get start url => urls', () => {
        const site = {
          startUrls: ['/path1', '/path2'],
          hostname: 'https://xxx.example.com',
        } as any;
        const result = service.getFullStartUrls(site);
        const expected = [
          'https://xxx.example.com/path1',
          'https://xxx.example.com/path2',
        ];
        expect(result).toEqual(expected);
      });
    });

    describe('convertPathsToUrls', () => {
      it('should get files => urls', () => {
        const site = {
          hostname: 'https://xxx.example.com',
        } as any;
        const paths = ['/path1', '/path2'];

        const result = service.convertPathsToUrls(site, paths);
        const expected = [
          'https://xxx.example.com/path1',
          'https://xxx.example.com/path2',
        ];
        expect(result).toEqual(expected);
      });
    });
  });
});
