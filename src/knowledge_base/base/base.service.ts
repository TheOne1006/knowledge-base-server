import { Sequelize } from 'sequelize-typescript';
import { join } from 'path';
import {
  Transactionable,
  WhereOptions,
  Transaction,
  OrderItem,
} from 'sequelize';
import { FileStatDto } from '../utils/dtos';
import {
  getAllFilesAndDirectoriesRecursively,
  flatFileAndDirRecursively,
} from '../utils/recursion-files';
import {
  checkDir,
  removeDir,
  doesFileExist,
  removeFile,
} from '../utils/check-dir';
import { config } from '../../../config';

const RESOURCES_ROOT = config.APP_CONFIG.KOWNLEDGE_BASE_RESOURCES_ROOT;

interface BaseModelT {
  count: (where: WhereOptions) => Promise<number>;
}

/**
 * 基础 Service
 */
abstract class BaseDBService<T extends BaseModelT, U> {
  protected readonly sequelize: Sequelize;
  protected readonly mainModel: T;

  constructor(sequelize: Sequelize, mainModel: T) {
    this.sequelize = sequelize;
    this.mainModel = mainModel;
  }

  /**
   * 获取 Transaction 对象
   * @returns {Promise<Transaction>}
   */
  protected async genTransaction(): Promise<Transaction> {
    const transaction = await this.sequelize.transaction();
    return transaction;
  }

  /**
   * 操作前 options
   * @param {Transaction} preTransaction
   * @returns {Promise<Transactionable>}
   */
  protected async genOptions(
    preTransaction?: Transaction,
  ): Promise<Transactionable> {
    const options = {
      transaction: preTransaction,
    };

    if (!preTransaction) {
      options.transaction = await this.sequelize.transaction();
    }

    return options;
  }

  /**
   * 如果存在 preTransaction 则无需提交, 否则提交
   * @param {Transactionable} options
   * @param {Transaction} preTransaction
   * @returns {Promise<void>}
   */
  protected async autoCommit(
    options: Transactionable,
    preTransaction?: Transaction,
  ): Promise<void> {
    if (!preTransaction && options.transaction) {
      await options.transaction.commit();
    }
  }

  /**
   * 创建
   * @param {any} pyload
   * @param {any} payload
   * @returns {Promise<U>}
   */
  abstract create(pyload: any, ...payload: any): Promise<U>;

  /**
   * 查找全部
   * @param {WhereOptions} where
   * @param {number} offset
   * @param {number} limit
   * @param {OrderItem} order
   * @returns {Promise<U[]>}
   */
  abstract findAll(
    where?: WhereOptions,
    offset?: number,
    limit?: number,
    order?: OrderItem,
  ): Promise<U[]>;

  /**
   * count 统计
   * @param {WhereOptions} where
   * @returns {Promise<number>}
   */
  async count(where?: WhereOptions): Promise<number> {
    return this.mainModel.count({
      where,
    });
  }

  /**
   * 根据id,查找
   * @param {number} id
   * @returns {Promise<U>}
   */
  abstract findByPk(id: number): Promise<U>;

  /**
   * 根据pk, 更新
   * @param {number} pk
   * @param {any} pyload
   * @param {Transaction} transaction
   * @returns {Promise<U>}
   */
  abstract updateByPk(
    pk: number,
    pyload: any,
    transaction?: Transaction,
  ): Promise<U>;

  /**
   * 根据id, 删除
   * @param {number} id
   * @param {Transaction} transaction
   * @returns {Promise<U>}
   */
  abstract removeByPk(id: number, transaction?: Transaction): Promise<U>;
}

export abstract class BaseService<
  T extends BaseModelT,
  U,
> extends BaseDBService<T, U> {
  /**
   * 获取资源 root 地址
   */
  protected getResourceRoot(): string {
    return RESOURCES_ROOT;
  }

  /**
   * 递归获取目录下的所有文件
   * @param {string} root
   * @param {boolean} isRecursion true 递归格式， false 展平处理
   * @param {string} ignorePathPrefix 忽略路径
   * @returns {Promise<FileStatDto[]>}
   */
  protected async getFiles(
    root: string,
    isRecursion: boolean = true,
    ignorePathPrefix: string = '',
  ): Promise<FileStatDto[]> {
    const pathExist = await this.checkPathExist(root);
    if (!pathExist) {
      return [];
    }

    const files = await getAllFilesAndDirectoriesRecursively(
      root,
      ignorePathPrefix,
    );

    if (!isRecursion) {
      // 展平
      return flatFileAndDirRecursively(files);
    } else {
      return files;
    }
  }

  /**
   * 检查目录是否存在, 如果不存在 则创建
   * @param  {string} dirPath
   * @returns {Promise<boolean>}
   */
  async checkPathExist(dirPath: string): Promise<boolean> {
    return doesFileExist(dirPath);
  }

  /**
   * 检查目录是否存在, 如果不存在 则创建
   * @param  {string} dirPath
   * @returns {Promise<boolean>}
   */
  async checkDir(dirPath: string): Promise<boolean> {
    return checkDir(dirPath);
  }

  /**
   * 检查目录是否存在, 存在则删除该目录
   * @param  {string} dirPath
   * @returns {Promise<boolean>}
   */
  async removeDir(dirPath: string): Promise<boolean> {
    return removeDir(dirPath);
  }

  /**
   * 检查文件是否存在, 存在则删除该文件
   * @param  {string} filePath
   * @returns {Promise<boolean>}
   */
  async removeFile(filePath: string): Promise<boolean> {
    return removeFile(filePath);
  }

  /**
   * 安全版版的 join
   * @param prev
   * @param paths
   * @returns
   */
  safeJoinPath(prev: string, ...paths: string[]): string {
    const reg = /^[\.]+/;
    // filePath 删除 最左边的 ..., 避免越界
    const safePaths = paths.map((item) => item.replace(reg, ''));
    return join(prev, ...safePaths).toString();
  }
}
