import { omit, map } from 'lodash';
import { Transaction, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { KnowledgeBase } from './kb.entity';
import { KbDto, CreateKbDto, UpdateKbDto } from './dtos';
import { FileStatDto } from '../utils/dtos';

import { BaseService } from '../base/base.service';

export class KbServiceDB extends BaseService<typeof KnowledgeBase, KbDto> {
  constructor(
    @Inject(Sequelize)
    protected readonly sequelize: Sequelize,
    @InjectModel(KnowledgeBase)
    protected readonly mainModel: typeof KnowledgeBase,
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
  ) {
    super(sequelize, mainModel);
  }

  /**
   * 创建
   * @param  {CreateKbDto} pyload
   * @param  {number} ownerId
   * @returns Promise<KbDto>
   */
  async create(pyload: CreateKbDto, ownerId: number): Promise<KbDto> {
    const data = new KnowledgeBase({
      ...pyload,
      ownerId,
    });
    const options = await this.genOptions();
    const instance = await data.save(options);
    await this.autoCommit(options);

    return instance;
  }

  /**
   * 查找全部 kb
   * @param {WhereOptions} where
   * @param {number} offset
   * @param {number} limit
   * @returns {Promise<KbDto[]>}
   */
  async findAll(
    where?: WhereOptions,
    offset?: number,
    limit?: number,
  ): Promise<KbDto[]> {
    return this.mainModel.findAll({
      where,
      offset: Math.max(0, offset) || undefined,
      limit: Math.max(0, limit) || undefined,
    });
  }

  /**
   * 根据id,查找
   * @param {number} id
   * @returns {Promise<KbDto>}
   */
  async findByPk(id: number): Promise<KbDto> {
    return this.mainModel.findByPk(id);
  }

  /**
   * 根据pk, 更新
   * @param {number} pk
   * @param {UpdateKbDto} pyload
   * @param {Transaction} transaction
   * @returns {Promise<KbDto>}
   */
  async updateByPk(
    pk: number,
    pyload: UpdateKbDto,
    transaction?: Transaction,
  ): Promise<KbDto> {
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

  /**
   * 根据id, 删除
   * @param {number} id
   * @param {Transaction} transaction
   * @returns {Promise<KbDto>}
   */
  async removeByPk(id: number, transaction?: Transaction): Promise<KbDto> {
    const data = await this.mainModel.findByPk(id);

    const options = await this.genOptions(transaction);
    await data.destroy(options);
    await this.autoCommit(options, transaction);
    return data;
  }
}

@Injectable()
export class KbService extends KbServiceDB {
  constructor(
    @Inject(Sequelize)
    protected readonly sequelize: Sequelize,
    @InjectModel(KnowledgeBase)
    protected readonly mainModel: typeof KnowledgeBase,
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
  ) {
    super(sequelize, mainModel, logger);
  }
  /**
   * 获取资源库的目录 = RESOURCES_ROOT + userId + kbId
   */
  getKbRoot(kb: KbDto) {
    return `${this.getResourceRoot()}/${kb.ownerId}/${kb.title}`;
  }

  /**
   * 获取资源库上传文件的目录 = getKbRoot() + _uploads
   * @param {KbDto} kb
   * @returns {string}
   */
  getKbUploadRoot(kb: KbDto): string {
    return `${this.getKbRoot(kb)}/_uploads`;
  }

  /**
   * 获取资源库的上传文件
   * @param {KbDto} kb
   * @returns {Promise<FileStatDto[]>}
   */
  async getUploadFiles(kb: KbDto): Promise<FileStatDto[]> {
    const uploadRoot = this.getKbUploadRoot(kb);
    const kbResRoot = this.getKbRoot(kb);
    this.checkDir(uploadRoot);
    return this.getFiles(uploadRoot, false, kbResRoot);
  }

  /**
   * 递归获取所有文件信息
   * @param {KbDto} kb
   * @param {string} subDir
   * @param {boolean} isRecursion
   * @param {string} ignorePathPrefix
   * @returns {Promise<FileStatDto[]>}
   */
  async getAllFiles(
    kb: KbDto,
    subDir?: string,
    isRecursion: boolean = true,
    ignorePathPrefix: string = '',
  ): Promise<FileStatDto[]> {
    let root = this.getKbRoot(kb);
    if (subDir) {
      root = `${root}/${subDir}`;
    }

    return this.getFiles(root, isRecursion, ignorePathPrefix);
  }
}
