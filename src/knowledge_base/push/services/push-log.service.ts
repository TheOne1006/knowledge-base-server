// import { pick, map } from 'lodash';
import { OrderItem, WhereOptions } from 'sequelize';
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

    const instance = await data.save();

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
    order?: OrderItem,
  ): Promise<PushLogDto[]> {
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
   * @returns {Promise<PushLogDto>}
   */
  async findByPk(id: number): Promise<PushLogDto> {
    return this.mainModel.findByPk(id);
  }

  /**
   * @param {WhereOptions} where
   * @returns {Promise<PushLogDto>}
   */
  async findLastOne(where?: WhereOptions): Promise<PushLogDto> {
    return this.mainModel.findOne({
      where,
      order: [['id', 'desc']],
    });
  }

  /**
   * 更新 pyload 禁用
   * @returns {Promise<PushLogDto>}
   */
  async updateByPk(): Promise<PushLogDto> {
    throw new Error('Method not Allow.');
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
