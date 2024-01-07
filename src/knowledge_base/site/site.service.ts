import { omit, map } from 'lodash';
import { Transaction, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { KnowledgeBaseSite } from './site.entity';
import { KbSiteDto, CreateKbSiteDto, UpdateKbSiteDto } from './dtos';

import { BaseService } from '../base/base.service';

@Injectable()
export class KbSiteService extends BaseService<
  typeof KnowledgeBaseSite,
  KbSiteDto
> {
  constructor(
    @Inject(Sequelize)
    protected readonly sequelize: Sequelize,
    @InjectModel(KnowledgeBaseSite)
    protected readonly mainModel: typeof KnowledgeBaseSite,
  ) {
    super(sequelize, mainModel);
  }

  /**
   * 创建
   * @param  {CreateKbSiteDto} pyload
   * @param  {number} kbId
   * @param  {number} ownerId
   * @returns {Promise<KbSiteDto>}
   */
  async create(
    pyload: CreateKbSiteDto,
    kbId: number,
    ownerId: number,
  ): Promise<KbSiteDto> {
    const data = new this.mainModel({
      ...pyload,
      kbId,
      ownerId,
    });

    console.log('create:');
    console.log(data);

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
   * @returns {Promise<KbSiteDto[]>}
   */
  async findAll(
    where?: WhereOptions,
    offset?: number,
    limit?: number,
  ): Promise<KbSiteDto[]> {
    return this.mainModel.findAll({
      where,
      offset: offset > 0 ? offset : null,
      limit: limit > 0 ? limit : null,
    });
  }

  /**
   * 根据id,查找
   * @param {number} id
   * @returns {Promise<KbSiteDto>}
   */
  async findByPk(id: number): Promise<KbSiteDto> {
    return this.mainModel.findByPk(id);
  }

  /**
   * todo: 同步删除 目录
   * 根据id, 删除
   * @param {number} id
   * @param {Transaction} transaction
   * @returns Promise<KbSiteDto>
   */
  async removeByPk(id: number, transaction?: Transaction): Promise<KbSiteDto> {
    const data = await this.mainModel.findByPk(id);

    const options = await this.genOptions(transaction);
    await data.destroy(options);
    await this.autoCommit(options, transaction);
    return data;
  }

  /**
   * 根据pk, 更新
   * @param {number} pk
   * @param {UpdateKbDto} pyload
   * @param {Transaction} transaction
   * @returns Promise<KbSiteDto>
   */
  async updateByPk(
    pk: number,
    pyload: UpdateKbSiteDto,
    transaction?: Transaction,
  ) {
    const instance = await this.mainModel.findByPk(pk);

    if (!instance) {
      throw new Error('instance not found');
    }

    const updatePayload = omit(pyload, ['ownerId', 'id', 'title']);

    map(updatePayload, (value: any, key: string) => {
      const originalValue = instance.get(key);
      if (value !== originalValue) {
        updatePayload[key] = value;
      }
    });

    const options = await this.genOptions(transaction);
    await instance.save(options);
    await this.autoCommit(options, transaction);

    return instance;
  }
}
