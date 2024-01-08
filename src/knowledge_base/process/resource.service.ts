import * as fs from 'fs/promises';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { urlAppendSuffix } from './libs/append-suffix';

@Injectable()
export class KbResourceService {
  /**
   * 检查目录是否存在, 如果不存在 则创建
   * @param  {string} dirPath
   * @returns {Promise<boolean>}
   */
  async checkDir(dirPath: string): Promise<boolean> {
    let isExists = true;

    try {
      await fs.access(dirPath);
    } catch (error) {
      isExists = false;
    }
    if (!isExists) {
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        throw new Error('dirPath is not a directory');
      }
    }

    return true;
  }

  /**
   * 保存 html
   * @param {string} kbSiteResRoot
   * @param {string} url
   * @param {string} html
   * @returns {Promise<void>}
   */
  async saveHtml(
    kbSiteResRoot: string,
    url: string,
    html: string,
  ): Promise<void> {
    const urlObj = urlAppendSuffix(url);

    const filePath = `${kbSiteResRoot}${urlObj.pathname}`;
    // 获取 filePath 的目录
    await this.checkDir(path.dirname(filePath));
    await fs.writeFile(filePath, html);
  }
}
