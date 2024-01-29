/**
 * 爬虫引擎
 */
export const CRAWLER_ENGINE_PLAYWRIGHT = 'playwright';
export const CRAWLER_ENGINE_LARK_MD = 'lark2md';

export type CRAWLER_ENGINE_TYPES =
  | typeof CRAWLER_ENGINE_PLAYWRIGHT
  | typeof CRAWLER_ENGINE_LARK_MD;
