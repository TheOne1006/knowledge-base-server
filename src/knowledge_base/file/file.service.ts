import { pick, map } from 'lodash';
import { WhereOptions, OrderItem } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { KnowledgeBaseFile } from './file.entity';
import { KbFileDto, CreateKbFileDto, UpdateKbFileDto } from './dtos';
import { BaseService } from '../base/base.service';
import { generateFileHash } from '../utils/file-tools';

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

  private completeFilePathPrefix(filePath: string) {
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
  }

  private async generateFileHash(absFilePath: string) {
    const checksum = await generateFileHash(absFilePath);

    return checksum;
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
    let filePath = pyload?.filePath || '';
    // 1.md
    if (filePath.length <= 4) {
      throw new Error('error filePath');
    }

    filePath = this.completeFilePathPrefix(filePath);
    // 校验 filePath
    const absFilePath = this.safeJoinPath(
      this.getKbRoot(ownerId, kbId),
      filePath,
    );
    const checksum = await this.generateFileHash(absFilePath);

    const data = new this.mainModel({
      ...pyload,
      filePath,
      checksum,
      kbId,
      ownerId,
    });

    const instance = await data.save();

    return instance;
  }

  /**
   * 批量创建
   * @param  {CreateKbFileDto[]}     payloads: CreateKbFileDto[],

   * @param  {number} ownerId
   * @param  {number} kbId
   * @param  {string} sourceType
   * @returns {Promise<KbFileDto>}
   */
  async batchCreate(
    payloads: CreateKbFileDto[],
    ownerId: number,
    kbId: number,
    sourceType: string,
  ): Promise<KbFileDto[]> {
    const data: Partial<KbFileDto>[] = [];

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];

      // 校验 filePath
      const absFilePath = this.safeJoinPath(
        this.getKbRoot(ownerId, kbId),
        payload.filePath,
      );

      const checksum = await this.generateFileHash(absFilePath);

      data.push({
        ...payload,
        checksum,
        sourceType,
        ownerId,
        kbId,
        filePath: this.completeFilePathPrefix(payload.filePath),
      });
    }

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

    // 校验 filePath
    const absFilePath = this.safeJoinPath(
      this.getKbRoot(instance.ownerId, instance.kbId),
      instance.filePath,
    );

    const checksum = await this.generateFileHash(absFilePath);

    const updatePayload = {
      ...pick(pyload, ['sourceUrl', 'summary']),
      checksum,
    };

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
   * 查找或者更新
   * @param {Partial<KbFileDto>} pyload
   * @param {string} queryFilePath
   * @param {number} kbId
   * @param {number} ownerId
   * @param {number} siteId
   * @returns {Promise<KbFileDto>}
   */
  async findOrUpdate(
    pyload: Partial<KbFileDto>,
    queryFilePath: string,
    kbId: number,
    ownerId: number,
    siteId?: number,
  ): Promise<KbFileDto> {
    const filePath = this.completeFilePathPrefix(queryFilePath);

    const where: WhereOptions = {
      kbId,
      filePath,
      ownerId,
    };

    if (siteId) {
      where.siteId = siteId;
    }

    const instance = await this.mainModel.findOne({
      where,
    });

    if (!instance) {
      return this.create(
        {
          ...pyload,
          ...where,
          filePath,
        },
        kbId,
        ownerId,
      );
    }

    return this.updateByPk(instance.id, {});
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
    return this.safeJoinPath(kbResRoot, filePath);
  }
}
