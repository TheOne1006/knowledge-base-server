import { uniq, difference } from 'lodash';
// import { Logger } from 'winston';

import { Logger, Injectable } from '@nestjs/common';
import { CRAWLER_TYPES, CRAWLER_TYPE_INCREMENTAL } from '../process/constants';
import { urlAppendSuffix, urlRemoveHash } from './link-format';

/**
 * @description 爬虫url管理器
 */
@Injectable()
export class CrawlerUrlsManager {
  protected readonly logger = new Logger('CrawlerUrlsManager');
  /**
   * 爬虫的 pattern
   */
  private pattern: RegExp;
  /**
   * 需要爬取的urls
   */
  private urls: string[];

  /**
   * crawler 类型
   */
  private type: CRAWLER_TYPES = CRAWLER_TYPE_INCREMENTAL;

  /**
   * 已下载到本地 urls 信息
   */
  private localUrls: string[];

  /**
   * 当前索引位置
   */
  private currentPointer: number = 0;

  /**
   * 重试次数
   */
  private maxRetryTimes: number = 3;

  /**
   * 当前需要抓取的连接
   */
  private maxConnections: number = 5;

  /**
   * 重试的 url 信息
   */
  private retryUrlItems: {
    [url: string]: number;
  } = {};

  /**
   * @description 爬虫url管理器
   * @param {string[]} initUrls
   * @param {number} maxRetryTimes 重试次数
   * @param {number} maxConnections 最大连接数
   */
  constructor(
    pattern: string,
    initUrls: string[] = [],
    maxRetryTimes: number = 3,
    maxConnections: number = 5,
    type: CRAWLER_TYPES = CRAWLER_TYPE_INCREMENTAL,
    localUrls: string[] = [],
  ) {
    this.pattern = new RegExp(pattern);
    this.urls = uniq(initUrls);
    this.maxRetryTimes = maxRetryTimes;
    this.maxConnections = maxConnections;
    this.type = type;
    this.localUrls = localUrls;
  }

  /**
   * 添加新的 链接 到 urls 中
   * @param newUrls
   */
  private appendUrls(newUrls: string[]) {
    const diff = difference(newUrls, this.urls);
    this.urls.push(...diff);
  }

  /**
   * 获取下一批链接
   * @returns {string[]}
   */
  getNextBatch(): string[] {
    // 先获取 urls，最多不超过 maxConnections 个
    const urls = this.urls.slice(this.currentPointer, this.maxConnections);
    this.currentPointer += urls.length;

    // 再加上重试的连接，不超过 maxRetryTimes 次
    const retryUrls = Object.keys(this.retryUrlItems).filter(
      (item) => this.retryUrlItems[item] < this.maxRetryTimes,
    );

    urls.push(...retryUrls);
    return urls;
  }

  /**
   * 是否有下一个批次
   * @returns {boolean}
   */
  hasNextBatch(): boolean {
    // 当 currentPointer 小于 maxConnections 且 小于 urls.length 时, 继续抓取
    const hasNextBatch =
      this.currentPointer < this.urls.length &&
      this.currentPointer < this.maxConnections;

    // 当有重试的 url 时，继续抓取
    const hasRetryUrls = Object.keys(this.retryUrlItems).some(
      (item) => this.retryUrlItems[item] < this.maxRetryTimes,
    );

    return hasNextBatch || hasRetryUrls;
  }

  /**
   * 排除在 localUrls 的 urls
   * @param {string[]} urls
   * @returns {string[]}
   */
  private excludeLocalUrls(urls: string[]): string[] {
    // urls => 以 .xxx 的结尾的urls
    const links = urls
      // .map((item) => urlRemoveHash(item)) # 提取的时候已经删除
      .map((url) => urlAppendSuffix(url, '.html'))
      .map((item) => item.toString());

    // 遍历 sufUrls 如果存在于 this.localUrls, 则排除，没有则保留 urls 的信息
    const uniqueUrls = [];
    links.forEach((item, index) => {
      if (!this.localUrls.includes(item)) {
        uniqueUrls.push(urls[index]);
      }
    });

    return uniqueUrls;
  }

  /**
   * 过滤 urls 根据 正则表达式
   * @param urls
   * @returns
   */
  filterUrlsWithPattern(urls: string[]): string[] {
    return urls.filter((url) => this.pattern.test(url));
  }

  /**
   * 新增 urls 从 爬虫的 links 里, 排除已完成的
   */
  addUrlsFromCrawler(urls: string[]) {
    let newUrls = urls;
    // this.logger.info(`type: ${this.type}`);

    if (this.type === CRAWLER_TYPE_INCREMENTAL) {
      newUrls = this.excludeLocalUrls(urls);
    }

    newUrls = this.filterUrlsWithPattern(newUrls);

    // this.logger.info(`append url length: ${newUrls.length}`);
    // 添加到 urls 中
    this.appendUrls(newUrls);
  }

  /**
   * 添加重试的 url
   * @param url
   */
  addRetryUrl(url: string) {
    if (!this.retryUrlItems[url]) {
      this.retryUrlItems[url] = 1;
    } else {
      this.retryUrlItems[url] += 1;
    }
  }

  /**
   * 尝试删除 重试信息
   * @param {string} url
   */
  clearRetryUrl(url: string) {
    if (this.retryUrlItems[url]) {
      delete this.retryUrlItems[url];
    }
  }

  /**
   * 获取 总共的 urls 数量
   */
  getTotal() {
    return Math.min(this.urls.length, this.maxConnections);
  }

  /**
   * 获取 url 的索引
   * @param {string} url
   * @returns {number} -1 没找到, ...
   */
  getUrlIndex(url: string): number {
    return this.urls.indexOf(url);
  }

  /**
   * 获取 url 的重试次数
   * @param {string} url
   * @returns {number}
   */
  getUrlRetryUrlTimes(url: string): number {
    if (!this.retryUrlItems[url]) {
      return 0;
    }
    return this.retryUrlItems[url];
  }

  /**
   * 获取已处理的 urls
   * @returns {string[]}
   */
  getProcessedUrls() {
    return this.urls.slice(0, this.currentPointer);
  }
  /**
   * 获取 失败的 urls
   * @returns {string[]}
   */
  getFailedUrls() {
    return Object.keys(this.retryUrlItems);
  }
}
