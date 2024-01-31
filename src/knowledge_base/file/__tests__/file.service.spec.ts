import { SequelizeModule, getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import { KbFileService } from '../file.service';
import { KnowledgeBaseFile } from '../file.entity';

import { DatabaseModule } from '../../../core/database/database.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import {
  FILE_SOURCE_TYPE_UPLOAD,
  // FILE_SOURCE_TYPE_CRAWLER,
} from '../../base/constants';

const defaultAttr = {
  fileExt: 'html',
  ownerId: 1,
  kbId: 1,
  sourceType: FILE_SOURCE_TYPE_UPLOAD,
  checksum: 'hash',
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
  {
    ...defaultAttr,
    filePath: '/xxx/path/to/file6.html',
    id: 6,
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

  describe('Private Methods', () => {
    describe('completeFilePathPrefix', () => {
      it('should return the correct file path when the filePath starts with dots', () => {
        const filePath = '/relative/path/to/file.html';

        const result = service['completeFilePathPrefix'](filePath);

        expect(result).toEqual('/relative/path/to/file.html');
      });

      it('should return the correct file path when the filePath does not start with dots', () => {
        const filePath = 'relative/path/to/file.html';

        const result = service['completeFilePathPrefix'](filePath);

        expect(result).toEqual('/relative/path/to/file.html');
      });
    });

    describe('generateFileHash', () => {
      it('should return the correct file hash', async () => {
        const absFilePath = service.safeJoinPath(
          __dirname,
          'mocks',
          'tmp2.txt',
        );

        const result = await service['generateFileHash'](absFilePath);

        expect(result).toEqual(
          '74b4147957813b62cc8987f2b711ddb31f8cb46dcbf71502033da66053c8780a',
        );
      });
    });
  });

  describe('DB operation', () => {
    beforeAll(() => {
      jest
        .spyOn(service as any, 'generateFileHash')
        .mockResolvedValue('sha256');
    });
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
      it('should create more instances', async () => {
        const dtos = [
          {
            filePath: '/tmp_batch/path/to/file.txt',
            fileExt: 'txt',
          },
          {
            filePath: 'tmp_batch/path/to/file2.txt',
            fileExt: 'txt',
          },
        ];
        const ownerId = 1;
        const kId = 1;
        const result = await service.batchCreate(
          dtos,
          ownerId,
          kId,
          FILE_SOURCE_TYPE_UPLOAD,
        );
        expect(result).toBeDefined();
        // 最后一个元素
        const last = mockData[mockData.length - 1];
        expect(result[0].id).toBeGreaterThan(last.id);
        expect(result[1].filePath).toEqual('/tmp_batch/path/to/file2.txt');
      });
    });

    describe('findAll', () => {
      it('should return all instance', async () => {
        const result = await service.findAll();
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(2);
      });

      it('should return all instance with order', async () => {
        const result = await service.findAll(undefined, 1, 2, ['id', 'DESC']);
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

    describe('updateByPk', () => {
      it('should update a instance by its primary key', async () => {
        const pk = 3;
        const dto = {
          summary: 'update',
          sourceUrl: 'http://xxx.com',
        };
        const result = await service.updateByPk(pk, dto);
        expect(result).toBeDefined();
        expect(result.summary).toEqual(dto.summary);
        expect(result.sourceUrl).toEqual(dto.sourceUrl);
      });

      it('should update a instance by error primary key', async () => {
        const pk = 100000;
        const dto = {
          ...defaultAttr,
          summary: 'update',
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

    describe('batchDeleteByIds', () => {
      it('should remove some instances by primary keys', async () => {
        const result = await service.batchDeleteByIds([5, 6]);
        expect(result).toBeDefined();
        const deleteResult = await service.findByPk(5);
        expect(deleteResult).toBeNull();
      });
    });

    describe('findOrUpdate', () => {
      it('should return an existing instance if it exists', async () => {
        const payload = {
          filePath: '/xxx/path/to/file.html',
          fileExt: 'html',
        };
        const kbId = 1;
        const ownerId = 1;

        const result = await service.findOrUpdate(
          payload,
          payload.filePath,
          kbId,
          ownerId,
        );

        expect(result.id).toEqual(1);
      });

      it('should create a new instance if it does not exist', async () => {
        const payload = {
          filePath: '/xxx/path/to/newfile-findOrUpdate.html',
          fileExt: 'html',
        };
        const kbId = 1;
        const siteId = 1;
        const ownerId = 1;

        const result = await service.findOrUpdate(
          payload,
          payload.filePath,
          kbId,
          ownerId,
          siteId,
        );

        expect(result).toMatchObject({
          ...payload,
          kbId,
          ownerId,
        });
      });
    });
  });

  describe('Fle operation', () => {
    describe('getFilePath', () => {
      it('should return the correct file path when the instance filePath starts with dots', () => {
        const kbResRoot = '/root/path';
        const instance = {
          filePath: '../relative/path/to/file.html',
        } as any;

        const result = service.getFilePath(kbResRoot, instance.filePath);

        expect(result).toEqual('/root/path/relative/path/to/file.html');
      });

      it('should return the correct file path when the instance filePath does not start with dots', () => {
        const kbResRoot = '/root/path';
        const instance = {
          filePath: 'relative/path/to/file.html',
        } as any;

        const result = service.getFilePath(kbResRoot, instance.filePath);

        expect(result).toEqual('/root/path/relative/path/to/file.html');
      });
    });
  });
});
