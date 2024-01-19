import { pick, map } from 'lodash';
import { Transaction, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PushLog } from '../entites/push-log.entity';
import { PushLogDto } from '../dtos';
import { BaseService } from '../../base/base.service';

@Injectable()
class PushLogDBService extends BaseService<typeof PushLog, PushLogDto> {
  constructor(
    @Inject(Sequelize)
    protected readonly sequelize: Sequelize,
    @InjectModel(PushLog)
    protected readonly mainModel: typeof PushLog,
  ) {
    super(sequelize, mainModel);
  }

  /**
   * 创建
   * @param  {Partial<PushLogDto>} pyload
   * @param  {number} kbId
   * @param  {number} ownerId
   * @returns {Promise<PushLogDto>}
   */
  async create(
    pyload: Partial<PushLogDto>,
    kbId: number,
    ownerId: number,
  ): Promise<PushLogDto> {
    const data = new this.mainModel({
      ...pyload,
      kbId,
      ownerId,
    });

    const options = await this.genOptions();
    const instance = await data.save(options);
    await this.autoCommit(options);

    return instance;
  }

  /**
   * 查找全部
   * @param {WhereOptions} where
   * @param {number} offset
   * @param {number} limit
   * @returns {Promise<PushLogDto[]>}
   */
  async findAll(
    where?: WhereOptions,
    offset?: number,
    limit?: number,
  ): Promise<PushLogDto[]> {
    return this.mainModel.findAll({
      where,
      offset: Math.max(0, offset) || undefined,
      limit: Math.max(0, limit) || undefined,
    });
  }

  /**
   * 根据id,查找
   * @param {number} id
   * @returns {Promise<PushLogDto>}
   */
  async findByPk(id: number): Promise<PushLogDto> {
    return this.mainModel.findByPk(id);
  }

  /**
   * 根据pk, 更新 pyload
   * @param {number} pk
   * @param {Partial<PushLogDto>} pyload
   * @param {Transaction} transaction
   * @returns {Promise<PushLogDto>}
   */
  async updateByPk(
    pk: number,
    pyload: Partial<PushLogDto>,
    transaction?: Transaction,
  ): Promise<PushLogDto> {
    const instance = await this.mainModel.findByPk(pk);

    if (!instance) {
      throw new Error('instance not found');
    }

    const updatePayload = pick(pyload, ['status']);

    map(updatePayload, (value: any, key: string) => {
      const originalValue = instance.get(key);
      if (value !== originalValue) {
        instance[key] = value;
      }
    });

    const options = await this.genOptions(transaction);
    await instance.save(options);
    await this.autoCommit(options, transaction);

    return instance;
  }

  /**
   * @returns {Promise<PushLogDto>}
   */
  async removeByPk(): Promise<PushLogDto> {
    throw new Error('Method not Allow.');
  }
}

@Injectable()
export class PushLogService extends PushLogDBService {}
