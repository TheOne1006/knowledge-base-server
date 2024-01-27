import * as fs from 'fs/promises';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { urlAppendSuffix } from '../utils/link-format';
import { checkDir } from '../utils/file-tools';

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
   * @param {string} kbRoot
   * @param {string} kbSiteTitle
   * @param {string} url
   * @param {string} html
   * @returns {Promise<string>} 相对于 kbRoot 的路径
   */
  async saveHtml(
    kbRoot: string,
    kbSiteTitle: string,
    url: string,
    html: string,
  ): Promise<string> {
    const urlObj = urlAppendSuffix(url, '.html');
    const filePath = path.join(kbSiteTitle, urlObj.pathname);
    const absFilePath = path.join(kbRoot, filePath);
    // 获取 filePath 的目录
    await this.checkDir(path.dirname(absFilePath));
    await fs.writeFile(absFilePath, html);

    return filePath;
  }
}
