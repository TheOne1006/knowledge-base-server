import { Logger } from 'winston';

import { CustomPlaywrightWebBaseLoader } from '../loaders/CustomPlaywrightWebBaseLoader';

/**
 * @description 爬虫基类
 */
export class BasePlaywrightCrawlerService {
  protected readonly logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }
  /**
   * 爬取 url 以及执行 evaluate
   * @param  {string} url
   * @param  {string} evaluateFuncString
   * @returns {Promise<string>}
   */
  async crawlUrlAndEvaluate(
    url: string,
    evaluateFuncString: string = '',
  ): Promise<string> {
    // 传入的 evaluateFuncString 会被转换成一个函数
    let evaluate: any;
    if (evaluateFuncString) {
      evaluate = new Function(
        'page',
        'browser',
        'response',
        'return (async () => {' + evaluateFuncString + '})();',
      );
    }

    let loader: CustomPlaywrightWebBaseLoader;
    try {
      loader = new CustomPlaywrightWebBaseLoader(url, {
        launchOptions: {
          headless: true,
        },
        gotoOptions: {
          timeout: 30 * 1000, // 30s
          /**
           * "load"：这个选项表示页面已经完成加载，包括所有的依赖资源如样式表和图片。
           * "domcontentloaded"：这个选项表示 HTML 文档已被完全加载和解析，不等待样式表、图像和子框架的完成加载。
           * "networkidle"：这个选项表示网络连接已经空闲，没有更多的资源正在加载。
           * "commit"：这个选项表示新的页面已经提交，即将开始加载。
           */
          waitUntil: 'domcontentloaded',
        },
        evaluate,
      });
    } catch (error) {
      this.logger.error('BasePlaywrightCrawler: error with', url);
      throw error;
    }
    this.logger.info('BasePlaywrightCrawler start:', url);

    let docs: any[];

    try {
      docs = await loader.load();
    } catch (error) {
      // console.log(error);
      throw error;
    }
    this.logger.info('BasePlaywrightCrawler finish:', url);
    const html = docs[0].pageContent;
    return html;
  }
}
