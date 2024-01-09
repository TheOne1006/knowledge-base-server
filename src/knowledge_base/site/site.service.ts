import { omit, map } from 'lodash';
import { Transaction, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { KnowledgeBaseSite } from './site.entity';
import { KbSiteDto, CreateKbSiteDto, UpdateKbSiteDto } from './dtos';

import { BaseService } from '../base/base.service';
class KbSiteServiceDB extends BaseService<typeof KnowledgeBaseSite, KbSiteDto> {
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
      offset: Math.max(0, offset) || null,
      limit: Math.max(0, limit) || null,
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
   *
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
        instance[key] = value;
      }
    });

    const options = await this.genOptions(transaction);
    await instance.save(options);
    await this.autoCommit(options, transaction);

    return instance;
  }
}

@Injectable()
export class KbSiteService extends KbSiteServiceDB {
  /**
   * 获取 站点的本地 根目录
   * @param {string} kbResRoot
   * @param {KbSiteDto} bkSiteIns
   * @returns {string}
   */
  getKbSiteRoot(kbResRoot: string, bkSiteIns: KbSiteDto): string {
    return `${kbResRoot}/${bkSiteIns.title}`;
  }

  /**
   * 获取完整版的 startUrls
   * @param {KbSiteDto} bkSiteIns
   * @returns {string[]}
   */
  getFullStartUrls(bkSiteIns: KbSiteDto): string[] {
    const startUrls = bkSiteIns.startUrls;
    return this.convertPathsToUrls(bkSiteIns, startUrls);
  }

  /**
   * 将本地文件路径转换成 url
   * @param {KbSiteDto} bkSiteIns
   * @param {string[]} paths
   * @returns {string[]}
   */
  convertPathsToUrls(bkSiteIns: KbSiteDto, paths: string[]): string[] {
    const urls = paths.map((item) => {
      const urlObj = new URL(item, bkSiteIns.hostname);
      return urlObj.href;
    });

    return urls;
  }
}
