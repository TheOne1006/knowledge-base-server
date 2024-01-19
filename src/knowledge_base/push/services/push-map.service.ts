import { omit, map } from 'lodash';
import { Transaction, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PushMap } from '../entites/push-map.entity';
import { PushMapDto } from '../dtos';

import { BaseService } from '../../base/base.service';

@Injectable()
class PushMapDBService extends BaseService<typeof PushMap, PushMapDto> {
  constructor(
    @Inject(Sequelize)
    protected readonly sequelize: Sequelize,
    @InjectModel(PushMap)
    protected readonly mainModel: typeof PushMap,
  ) {
    super(sequelize, mainModel);
  }

  /**
   * 创建
   * @param  {Partial<PushMapDto>} pyload
   * @param  {number} kbId
   * @param  {number} ownerId
   * @returns {Promise<PushMapDto>}
   */
  async create(
    pyload: Partial<PushMapDto>,
    kbId: number,
    ownerId: number,
  ): Promise<PushMapDto> {
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
   * @returns {Promise<PushMapDto[]>}
   */
  async findAll(
    where?: WhereOptions,
    offset?: number,
    limit?: number,
  ): Promise<PushMapDto[]> {
    return this.mainModel.findAll({
      where,
      offset: Math.max(0, offset) || undefined,
      limit: Math.max(0, limit) || undefined,
    });
  }

  /**
   * 根据id,查找
   * @param {number} id
   * @returns {Promise<PushMapDto>}
   */
  async findByPk(id: number): Promise<PushMapDto> {
    return this.mainModel.findByPk(id);
  }

  /**
   * 根据pk, 更新 pyload
   * @param {number} pk
   * @param {Partial<PushMapDto>} pyload
   * @param {Transaction} transaction
   * @returns {Promise<PushMapDto>}
   */
  async updateByPk(
    pk: number,
    pyload: Partial<PushMapDto>,
    transaction?: Transaction,
  ): Promise<PushMapDto> {
    const instance = await this.mainModel.findByPk(pk);

    if (!instance) {
      throw new Error('instance not found');
    }

    const updatePayload = omit(pyload, [
      'id',
      'type',
      'fileId',
      'kbId',
      'ownerId',
      'remoteId',
    ]);

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
   *
   * 根据id, 删除
   * @param {number} id
   * @param {Transaction} transaction
   * @returns {Promise<PushMapDto>}
   */
  async removeByPk(id: number, transaction?: Transaction): Promise<PushMapDto> {
    const data = await this.mainModel.findByPk(id);

    const options = await this.genOptions(transaction);
    await data.destroy(options);
    await this.autoCommit(options, transaction);
    return data;
  }
}

@Injectable()
export class PushMapService extends PushMapDBService {}
