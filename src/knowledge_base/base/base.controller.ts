import { BadRequestException } from '@nestjs/common';
import { WhereOptions, Op } from 'sequelize';
import { I18nService } from 'nestjs-i18n';

export abstract class BaseController {
  // typescript 定义 service 含有一个 findAll 方法
  constructor(protected readonly i18n: I18nService) {}

  /**
   * 判断该实例不属于 ownerId
   * @param ins
   * @param ownerId
   */
  protected check_owner(ins: any, ownerId: number) {
    if (ins?.ownerId !== ownerId) {
      const message = this.i18n.t('error.INS_NOT_OWNER');
      throw new BadRequestException(message);
    }
  }

  /**
   * 构建 搜索 where 选项
   * @param {WhereOptions} where
   * @param {{ [key: string]: any }} exactSearch 精准搜索
   * @param {{ [key: string]: any }} fuzzyMatch 模糊匹配
   * @returns {WhereOptions}
   */
  protected buildSearchWhere(
    where: WhereOptions = {},
    exactSearch: { [key: string]: any } = {},
    fuzzyMatch: { [key: string]: any } = {},
  ): WhereOptions {
    Object.keys(exactSearch).forEach((key) => {
      if (exactSearch[key]) {
        where[key] = exactSearch[key];
      }
    });

    Object.keys(fuzzyMatch).forEach((key) => {
      if (fuzzyMatch[key]) {
        where[key] = {
          [Op.like]: `%${fuzzyMatch[key]}%`,
        };
      }
    });

    return where;
  }

  /**
   * 构建搜索 offset 和 limit
   * @param {number} start
   * @param {number} end
   * @returns
   */
  protected buildSearchOffsetAndLimit(
    start?: number,
    end?: number,
  ): [number, number] {
    const offset = start || 0;
    const limit = end - start > 0 ? end - start : 0;
    return [offset, limit];
  }

  /**
   * 构建搜索 order
   * @param {string} sort
   * @param {string} order
   * @returns
   */
  protected buildSearchOrder(
    sort?: string,
    order?: string,
  ): [string, string] | undefined {
    if (!sort) {
      return undefined;
    }

    const sortBy = order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    return [sort, sortBy];
  }
}
