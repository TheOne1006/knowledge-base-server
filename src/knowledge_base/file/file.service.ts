import { pick, map } from 'lodash';
import { WhereOptions, OrderItem } from 'sequelize';
import * as path from 'path';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { KnowledgeBaseFile } from './file.entity';
import { KbFileDto, CreateKbFileDto, UpdateKbFileDto } from './dtos';

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

    const instance = await data.save();

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
  ): Promise<KbFileDto[]> {
    const data = pyloads.map((payload) => ({
      ...payload,
      sourceType,
      ownerId,
      kbId,
    }));

    const instances = await this.mainModel.bulkCreate(data);

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
    order?: OrderItem,
  ): Promise<KbFileDto[]> {
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
   * @returns {Promise<KbFileDto>}
   */
  async findByPk(id: number): Promise<KbFileDto> {
    return this.mainModel.findByPk(id);
  }

  /**
   * @param {WhereOptions} where
   * @returns {Promise<PushLogDto>}
   */
  async findOne(where?: WhereOptions): Promise<KbFileDto> {
    return this.mainModel.findOne({
      where,
    });
  }

  /**
   * 根据pk, 更新 只接受 pyload
   * @param {number} pk
   * @param {UpdateKbFileDto} pyload
   * @returns {Promise<KbFileDto>}
   */
  async updateByPk(pk: number, pyload: UpdateKbFileDto): Promise<KbFileDto> {
    const instance = await this.mainModel.findByPk(pk);

    if (!instance) {
      throw new Error('instance not found');
    }

    const updatePayload = pick(pyload, ['sourceUrl', 'summary']);

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
   * @returns {Promise<KbFileDto>}
   */
  async removeByPk(id: number): Promise<KbFileDto> {
    const data = await this.mainModel.findByPk(id);

    await data.destroy();
    return data;
  }

  /**
   * 批量删除
   * @param {number[]} ids
   * @returns {Promise<number[]>}
   */
  async batchDeleteByIds(ids: number[]): Promise<number[]> {
    if (!ids.length) {
      return [];
    }

    await this.mainModel.destroy({
      where: {
        id: ids,
      },
    });
    return ids;
  }

  /**
   * 查找或者创建
   * @param {Partial<KbFileDto>} pyload
   * @param {string} filePath
   * @param {number} kbId
   * @param {number} ownerId
   * @param {number} siteId
   * @returns {Promise<KbFileDto>}
   */
  async findOrCreate(
    pyload: Partial<KbFileDto>,
    filePath: string,
    kbId: number,
    ownerId: number,
    siteId?: number,
  ): Promise<KbFileDto> {
    const where: WhereOptions = {
      kbId,
      filePath,
      ownerId,
    };

    if (siteId) {
      where.siteId = siteId;
    }

    let instance = await this.mainModel.findOne({
      where,
    });

    if (!instance) {
      instance = (await this.create(
        {
          ...pyload,
          ...where,
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
   * @param {string} filePath
   * @returns {string}
   */
  getFilePath(kbResRoot: string, filePath: string): string {
    // filePath 删除 最左边的 ..., 避免越界
    const trimFilePath = filePath.replace(/^[\.]+/, '');
    return path.join(kbResRoot, trimFilePath).toString();
  }
}
