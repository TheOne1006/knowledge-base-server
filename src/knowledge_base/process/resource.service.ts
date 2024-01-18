import * as fs from 'fs/promises';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { urlAppendSuffix } from '../utils/link-format';
import { checkDir } from '../utils/check-dir';

@Injectable()
export class KbResourceService {
  /**
   * 检查目录是否存在, 如果不存在 则创建
   * @param  {string} dirPath
   * @returns {Promise<boolean>}
   */
  async checkDir(dirPath: string): Promise<boolean> {
    return checkDir(dirPath);
  }

  /**
   * 保存 html
   * @param {string} kbSiteResRoot
   * @param {string} url
   * @param {string} html
   * @returns {Promise<string>}
   */
  async saveHtml(
    kbSiteResRoot: string,
    url: string,
    html: string,
  ): Promise<string> {
    const urlObj = urlAppendSuffix(url, '.html');

    const filePath = `${kbSiteResRoot}${urlObj.pathname}`;
    // 获取 filePath 的目录
    await this.checkDir(path.dirname(filePath));
    await fs.writeFile(filePath, html);

    return urlObj.pathname;
  }
}
