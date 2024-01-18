// import { omit, map } from 'lodash';
import { Transaction, WhereOptions } from 'sequelize';
import * as path from 'path';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { KnowledgeBaseFile } from './file.entity';
import { KbFileDto, CreateKbFileDto } from './dtos';

import { BaseService } from '../base/base.service';

@Injectable()
class KbFileDBService extends BaseService<typeof KnowledgeBaseFile, KbFileDto> {
  constructor(
    @Inject(Sequelize)
    protected readonly sequelize: Sequelize,
    @InjectModel(KnowledgeBaseFile)
    protected readonly mainModel: typeof KnowledgeBaseFile,
  ) {
    super(sequelize, mainModel);
  }

  /**
   * 创建
   * @param  {Partial<KbFileDto>} pyload
   * @param  {number} kbId
   * @param  {number} ownerId
   * @returns {Promise<KbFileDto>}
   */
  async create(
    pyload: Partial<KbFileDto>,
    kbId: number,
    ownerId: number,
  ): Promise<KbFileDto> {
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
   * 批量创建
   * @param  {CreateKbFileDto[]} pyloads
   * @param  {number} ownerId
   * @param  {number} kbId
   * @param  {string} sourceType
   * @returns {Promise<KbFileDto>}
   */
  async batchCreate(
    pyloads: CreateKbFileDto[],
    ownerId: number,
    kbId: number,
    sourceType: string,
    transaction?: Transaction,
  ): Promise<KbFileDto[]> {
    const data = pyloads.map((payload) => ({
      ...payload,
      sourceType,
      ownerId,
      kbId,
    }));

    const options = await this.genOptions(transaction);
    const instances = await this.mainModel.bulkCreate(data, options);
    await this.autoCommit(options, transaction);

    return instances;
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
  ): Promise<KbFileDto[]> {
    return this.mainModel.findAll({
      where,
      offset: Math.max(0, offset) || undefined,
      limit: Math.max(0, limit) || undefined,
    });
  }

  /**
   * 根据id,查找
   * @param {number} id
   * @returns {Promise<KbFileDto>}
   */
  async findByPk(id: number): Promise<KbFileDto> {
    return this.mainModel.findByPk(id);
  }

  /**
   * 根据pk, 更新 只接受 filePath
   * @param {number} pk
   * @param {string} filePath
   * @param {KbFileDto} transaction
   * @returns {Promise<KbFileDto>}
   */
  async updateByPk(
    pk: number,
    filePath: string,
    transaction?: Transaction,
  ): Promise<KbFileDto> {
    const instance = await this.mainModel.findByPk(pk);

    if (!instance) {
      throw new Error('instance not found');
    }

    instance.filePath = filePath;

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
   * @returns {Promise<KbFileDto>}
   */
  async removeByPk(id: number, transaction?: Transaction): Promise<KbFileDto> {
    const data = await this.mainModel.findByPk(id);

    const options = await this.genOptions(transaction);
    await data.destroy(options);
    await this.autoCommit(options, transaction);
    return data;
  }

  /**
   * 批量删除
   * @param {number[]} ids
   * @param {Transaction} transaction
   * @returns {Promise<number[]>}
   */
  async batchDeleteByIds(
    ids: number[],
    transaction?: Transaction,
  ): Promise<number[]> {
    const options = await this.genOptions(transaction);
    await this.mainModel.destroy({
      where: {
        id: ids,
      },
      ...options,
    });
    await this.autoCommit(options, transaction);

    return ids;
  }

  /**
   * 查找或者创建
   * @param {Partial<KbFileDto>} pyload
   * @param {string} filePath
   * @param {number} kbId
   * @param {number} siteId
   * @param {number} ownerId
   * @returns {Promise<KbFileDto>}
   */
  async findOrCreate(
    pyload: Partial<KbFileDto>,
    filePath: string,
    kbId: number,
    siteId: number,
    ownerId: number,
  ): Promise<KbFileDto> {
    let instance = await this.mainModel.findOne({
      where: {
        kbId,
        siteId,
        ownerId,
        filePath,
      },
    });

    if (!instance) {
      instance = (await this.create(
        {
          ...pyload,
          filePath,
        },
        kbId,
        ownerId,
      )) as KnowledgeBaseFile;
    }

    return instance;
  }
}

export class KbFileService extends KbFileDBService {
  /**
   * 获取文件路径
   * @param {string} kbResRoot
   * @param {KbFileDto} instance
   * @returns {string}
   */
  getFilePath(kbResRoot: string, instance: KbFileDto): string {
    // filePath 删除 最左边的 ...
    const filePath = instance.filePath.replace(/^[\.]+/, '');
    return path.join(kbResRoot, filePath).toString();
  }
}
