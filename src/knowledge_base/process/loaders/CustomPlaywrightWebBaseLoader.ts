import {
  PlaywrightWebBaseLoader,
  PlaywrightWebBaseLoaderOptions,
  // Page,
  // Browser,
} from 'langchain/document_loaders/web/playwright';
import { chromium } from 'playwright';

// PlaywrightWebBaseLoader.imports = async () => ({ chromium });

// timeout
const LOADER_TIMEOUT = 30 * 1000;

export class CustomPlaywrightWebBaseLoader extends PlaywrightWebBaseLoader {
  static async _scrape(
    url: string,
    options?: PlaywrightWebBaseLoaderOptions,
  ): Promise<string> {
    const browser = await chromium.launch({
      headless: true,
      ...options?.launchOptions,
    });

    try {
      const page = await browser.newPage();
      // 扩展，禁用 图片
      // await disableImagesAndVideos(page);
      await page.route('**/*.{png,jpg,jpeg,webp}', (route) => route.abort());

      const response = await page.goto(url, {
        timeout: LOADER_TIMEOUT,
        waitUntil: 'domcontentloaded',
        ...options?.gotoOptions,
      });
      const bodyHTML = options?.evaluate
        ? await options?.evaluate(page, browser, response)
        : await page.content();
      await browser.close();
      return bodyHTML;
    } catch (error) {
      // console.log('_scrape error:');
      // console.log(error);
      // page && page.close();
      browser && browser.close();
      throw error;
    }
  }

  async scrape() {
    const text = await CustomPlaywrightWebBaseLoader._scrape(
      this.webPath,
      this.options,
    );

    return text;
  }
}
