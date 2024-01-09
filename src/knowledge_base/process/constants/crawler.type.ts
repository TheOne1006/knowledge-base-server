/**
 * 全量爬取
 */
export const CRAWLER_TYPE_ALL = 'all';

/**
 * 增量爬取
 */
export const CRAWLER_TYPE_INCREMENTAL = 'incremental';

/**
 * 爬虫类型
 */
export type CRAWLER_TYPES =
  | typeof CRAWLER_TYPE_ALL
  | typeof CRAWLER_TYPE_INCREMENTAL;
