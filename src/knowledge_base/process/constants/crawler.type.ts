/**
 * 全量爬取
 */
export const CRAWLER_DATA_ALL = 'all';

/**
 * 增量爬取
 */
export const CRAWLER_DATA_INCREMENTAL = 'incremental';

/**
 * 爬虫数据类型
 */
export type CRAWLER_DATA_TYPES =
  | typeof CRAWLER_DATA_ALL
  | typeof CRAWLER_DATA_INCREMENTAL;
