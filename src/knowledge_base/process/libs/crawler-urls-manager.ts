import { uniq, difference } from 'lodash';
import { CRAWLER_TYPES, CRAWLER_TYPE_INCREMENTAL } from '../constants';
import { urlAppendSuffix } from './append-suffix';

/**
 * @description 爬虫url管理器
 */
export class CrawlerUrlsManager {
  /**
   * 需要爬取的urls
   */
  private urls: string[];

  /**
   * crawler 类型
   */
  private type: CRAWLER_TYPES = CRAWLER_TYPE_INCREMENTAL;

  /**
   * 已下载的 urls 信息
   */
  private completedUrls: string[];

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
    initUrls: string[] = [],
    maxRetryTimes: number = 3,
    maxConnections: number = 5,
    type: CRAWLER_TYPES = CRAWLER_TYPE_INCREMENTAL,
    completedUrls: string[] = [],
  ) {
    this.urls = uniq(initUrls);
    this.maxRetryTimes = maxRetryTimes;
    this.maxConnections = maxConnections;
    this.type = type;
    this.completedUrls = completedUrls;
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
   * 剔除在 completedUrls 的 urls
   * @param {string[]} urls
   * @returns {string[]}
   */
  private excludeCompletedUrls(urls: string[]): string[] {
    // urls => 以 .xxx 的结尾的urls
    const sufUrls = urls.map((url) => urlAppendSuffix(url, '.html').toString());

    // 遍历 sufUrls 如果存在于 this.completedUrls, 则排除，没有则保留 urls 的信息
    const uniqueUrls = [];

    sufUrls.forEach((item, index) => {
      if (!this.completedUrls.includes(item)) {
        uniqueUrls.push(urls[index]);
      }
    });

    return uniqueUrls;
  }

  /**
   * 新增 urls 从 爬虫的 links 里, 排除已完成的
   */
  addUrlsFromCrawler(urls: string[]) {
    let newUrls = urls;
    if (this.type === CRAWLER_TYPE_INCREMENTAL) {
      // 排除 completedUrls 的 urls
      newUrls = this.excludeCompletedUrls(urls);
    }

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
}
