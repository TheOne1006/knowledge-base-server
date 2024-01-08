import { omit, map } from 'lodash';
import { Transaction, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import * as fs from 'fs/promises';
import * as path from 'path';
import { KnowledgeBase } from './kb.entity';
import { KbDto, CreateKbDto, UpdateKbDto } from './dtos';
import { FileStatDto } from '../base/dtos';

import { BaseService } from '../base/base.service';
import { config } from '../../../config';

const RESOURCES_ROOT = config.APP_CONFIG.KOWNLEDGE_BASE_RESOURCES_ROOT;

export class KbServiceDB extends BaseService<typeof KnowledgeBase, KbDto> {
  constructor(
    @Inject(Sequelize)
    protected readonly sequelize: Sequelize,
    @InjectModel(KnowledgeBase)
    protected readonly mainModel: typeof KnowledgeBase,
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
      offset: offset > 0 ? offset : null,
      limit: limit > 0 ? limit : null,
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
        updatePayload[key] = value;
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
  ) {
    super(sequelize, mainModel);
  }
  /**
   * 获取资源库的目录 = RESOURCES_ROOT + userId + kbId
   */
  getKbRoot(kb: KbDto) {
    return `${RESOURCES_ROOT}/${kb.ownerId}/${kb.title}`;
  }

  /**
   * 递归获取所有文件信息
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
    const files = await this.getRecursionFiles(root, ignorePathPrefix);

    if (!isRecursion) {
      // 展平
      return this.flatFileStatDto(files);
    } else {
      return files;
    }
  }

  /**
   * 递归文件新信息
   * @param dir 目录
   * @param ignorePathPrefix 忽略的路径信息
   * @returns
   */
  private async getRecursionFiles(
    dir: string,
    ignorePathPrefix = '',
  ): Promise<FileStatDto[]> {
    const dirList = await fs.readdir(dir);
    const files: FileStatDto[] = [];

    dirList.forEach(async (item) => {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      const fullPathCrop = fullPath.replace(ignorePathPrefix, '');
      if (stat && stat.isDirectory()) {
        const children = await this.getRecursionFiles(fullPath);
        files.push({
          name: item,
          path: fullPathCrop,
          isDir: true,
          children,
        });
      } else {
        files.push({
          name: item,
          path: fullPathCrop,
          isDir: false,
        });
      }
    });
    return files;
  }

  /**
   * 展平所有 FileStatDto
   */
  private flatFileStatDto(files: FileStatDto[]): FileStatDto[] {
    const result: FileStatDto[] = [];
    files.forEach((item) => {
      if (item.isDir) {
        result.push(...this.flatFileStatDto(item.children));
      } else {
        result.push(item);
      }
    });
    return result;
  }
}
