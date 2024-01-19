import { Test, TestingModule } from '@nestjs/testing';
import * as path from 'path';
import * as fs from 'fs';
import { Injectable, Inject } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { SequelizeModule, getModelToken, InjectModel } from '@nestjs/sequelize';
import {
  Column,
  Model,
  Table,
  DataType,
  Sequelize,
} from 'sequelize-typescript';
import { BaseService } from '../base.service';
import { DatabaseModule } from '../../../core/database/database.module';
// import { BaseModelT } from '../base/base.model';

@Table({
  tableName: 'mock_base',
  version: true,
})
class MockBaseModel extends Model<MockBaseModel> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;
}

class MockBaseDto {
  id: number;
  title: string;
}

@Injectable()
class MockBaseService extends BaseService<typeof MockBaseModel, MockBaseDto> {
  constructor(
    @Inject(Sequelize)
    protected readonly sequelize: Sequelize,
    @InjectModel(MockBaseModel)
    protected readonly mainModel: typeof MockBaseModel,
  ) {
    super(sequelize, mainModel);
  }

  async findAll(where?: any): Promise<MockBaseDto[]> {
    return this.mainModel.findAll({
      where,
    });
  }

  async create(pyload: any): Promise<MockBaseDto> {
    const data = new this.mainModel({
      ...pyload,
    });

    const options = await this.genOptions();
    const instance = await data.save(options);
    await this.autoCommit(options);

    return instance;
  }

  async findByPk(id: number): Promise<MockBaseDto> {
    return this.mainModel.findByPk(id);
  }

  async updateByPk(id: number, pyload: any): Promise<MockBaseDto> {
    const data = await this.mainModel.findByPk(id);
    const options = await this.genOptions();
    const instance = await data.update(pyload, options);
    await this.autoCommit(options);

    return instance;
  }

  async removeByPk(id: number): Promise<MockBaseDto> {
    const data = await this.mainModel.findByPk(id);
    const options = await this.genOptions();
    await data.destroy(options);
    await this.autoCommit(options);
    return data;
  }
}

describe('BaseDBService', () => {
  let service: MockBaseService;
  let moduleRef: TestingModule;
  // let sequelize: Sequelize;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, SequelizeModule.forFeature([MockBaseModel])],
      providers: [MockBaseService],
    }).compile();
    // const sequelize: Sequelize = moduleRef.get(Sequelize);

    await MockBaseModel.sync({ force: true });

    service = moduleRef.get<MockBaseService>(MockBaseService);
    const CurModel = moduleRef.get(getModelToken(MockBaseModel));
    await CurModel.truncate();

    try {
      await CurModel.bulkCreate([
        { id: 1, title: 't1' },
        { id: 2, title: 't2' },
      ]);
    } catch (error) {
      console.error(error);
    }
  });
  afterAll(async () => {
    await moduleRef.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('genTransaction', () => {
    it('should generate a transaction', async () => {
      const result = await (service as any).genTransaction();
      expect(result).toBeInstanceOf(Transaction);

      await result.rollback();
    });
  });

  describe('genOptions', () => {
    it('should generate options with a transaction', async () => {
      const transaction = await (service as any).genTransaction();
      const result = await (service as any).genOptions(transaction);
      expect(result).toHaveProperty('transaction');
      expect(result.transaction).toEqual(transaction);

      await transaction.rollback();
    });

    it('should generate options with a new transaction if none is provided', async () => {
      const result = await (service as any).genOptions();
      expect(result).toHaveProperty('transaction');
      expect(result.transaction).toBeInstanceOf(Transaction);
      await result.transaction.rollback();
    });
  });

  describe('autoCommit', () => {
    it('should commit the transaction if no preTransaction is provided', async () => {
      const options = {
        transaction: {
          commit: jest.fn() as any,
        },
      };
      await (service as any).autoCommit(options);
      expect(options.transaction.commit).toHaveBeenCalled();
    });

    it('should not commit the transaction if a preTransaction is provided', async () => {
      const transaction = {
        commit: jest.fn(),
      };

      const options = {
        transaction: {
          commit: jest.fn() as any,
        },
      };
      await (service as any).autoCommit(options, transaction);
      expect(options.transaction.commit).not.toHaveBeenCalled();
      expect(transaction.commit).not.toHaveBeenCalled();
    });
  });

  describe('CREATE', () => {
    it('should create a new record', async () => {
      const result = await service.create({ title: 't3' });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title', 't3');
    });
  });

  describe('READ', () => {
    it('should count', async () => {
      const result = await service.count();
      expect(result).toBeGreaterThan(1);
    });
  });

  describe('FILE OP', () => {
    it('checkPathExist', async () => {
      // 获取当前目录
      const mock_dir = path.join(__dirname, 'mock_dir');
      const result = service.checkPathExist(mock_dir);
      expect(result).toBeTruthy();
    });

    describe('removeDir', () => {
      let mock_dir: string;
      beforeEach(async () => {
        mock_dir = path.join(__dirname, 'mock_dir', 'mock2');
        await service.checkDir(mock_dir);
      });

      it('should return true if the directory was successfully removed', async () => {
        const result = await service.removeDir(mock_dir);
        expect(result).toBeTruthy();
      });
    });

    describe('removeFile', () => {
      let mock_file: string;
      beforeEach(async () => {
        const mock_dir = path.join(__dirname, 'mock_dir');
        await service.checkDir(mock_dir);
        mock_file = path.join(mock_dir, 'text.txt');
        // 创建文件
        fs.writeFile(mock_file, 'Hello World!', (err) => {
          if (err) throw err;
        });
      });

      it('should return true if the directory was successfully removed', async () => {
        const result = await service.removeFile(mock_file);
        expect(result).toBeTruthy();
      });
    });
  });
});
