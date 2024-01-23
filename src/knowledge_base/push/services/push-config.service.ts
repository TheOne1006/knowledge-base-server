import { omit, map } from 'lodash';
import { WhereOptions, OrderItem } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PushConfig } from '../entites/push-config.entity';
import {
  PushConfigDto,
  CreatePushConfigDto,
  UpdatePushConfigDto,
} from '../dtos';

import { BaseService } from '../../base/base.service';

@Injectable()
class PushConfigDBService extends BaseService<
  typeof PushConfig,
  PushConfigDto
> {
  constructor(
    @Inject(Sequelize)
    protected readonly sequelize: Sequelize,
    @InjectModel(PushConfig)
    protected readonly mainModel: typeof PushConfig,
  ) {
    super(sequelize, mainModel);
  }

  /**
   * 创建
   * @param  {CreatePushConfigDto} pyload
   * @param  {number} kbId
   * @param  {number} ownerId
   * @returns {Promise<PushConfigDto>}
   */
  async create(
    pyload: CreatePushConfigDto,
    kbId: number,
    ownerId: number,
  ): Promise<PushConfigDto> {
    const data = new this.mainModel({
      ...pyload,
      kbId,
      ownerId,
    });

    const instance = await data.save();

    return instance;
  }

  /**
   * 查找全部
   * @param {WhereOptions} where
   * @param {number} offset
   * @param {number} limit
   * @returns {Promise<U[]>}
   */
  async findAll(
    where?: WhereOptions,
    offset?: number,
    limit?: number,
    order?: OrderItem,
  ): Promise<PushConfigDto[]> {
    return this.mainModel.findAll({
      where,
      offset: Math.max(0, offset) || undefined,
      limit: Math.max(0, limit) || undefined,
      order: order && [order],
    });
  }

  /**
   * 根据id,查找
   * @param {number} id
   * @returns {Promise<PushConfigDto>}
   */
  async findByPk(id: number): Promise<PushConfigDto> {
    return this.mainModel.findByPk(id);
  }

  /**
   * 根据pk, 更新 pyload
   * @param {number} pk
   * @param {UpdatePushConfigDto} pyload
   * @returns {Promise<PushConfigDto>}
   */
  async updateByPk(
    pk: number,
    pyload: UpdatePushConfigDto,
  ): Promise<PushConfigDto> {
    const instance = await this.mainModel.findByPk(pk);

    if (!instance) {
      throw new Error('instance not found');
    }

    const updatePayload = omit(pyload, ['id', 'type', 'kid', 'ownerId']);

    map(updatePayload, (value: any, key: string) => {
      const originalValue = instance.get(key);
      if (value !== originalValue) {
        instance[key] = value;
      }
    });

    await instance.save();

    return instance;
  }

  /**
   *
   * 根据id, 删除
   * @param {number} id
   * @returns {Promise<PushConfigDto>}
   */
  async removeByPk(id: number): Promise<PushConfigDto> {
    const data = await this.mainModel.findByPk(id);
    await data.destroy();
    return data;
  }
}

@Injectable()
export class PushConfigService extends PushConfigDBService {}
