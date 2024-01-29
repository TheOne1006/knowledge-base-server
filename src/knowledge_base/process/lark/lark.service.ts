import { Injectable, Inject } from '@nestjs/common';
import { Logger } from 'winston';
// import * as cheerio from 'cheerio';
import {
  Client,
  // LoggerLevel
} from '@larksuiteoapi/node-sdk';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import { config } from '../../../../config';
import { LarkDocs2Md } from '../../../libs/lockdoc2md/main';

@Injectable()
export class LarkService {
  private client: Client;
  private doc2mdService: LarkDocs2Md;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
  ) {
    this.client = new Client({
      appId: config.FEISHU.appId,
      appSecret: config.FEISHU.appSecret,
      disableTokenCache: false,
      loggerLevel: 2, // info 3 ; debug 4
    });
    this.doc2mdService = new LarkDocs2Md(this.client);
  }

  async link2md(link: string): Promise<string> {
    return this.doc2mdService.link2md(link);
  }

  /**
   * 创建 导出任务
   * @param {string} fileToken
   * @returns {Promise<string>}
   */
  async createExportTasks(
    fileToken: string,
    fileExtension: 'docx' | 'pdf' | 'xlsx' | 'csv' = 'docx',
  ): Promise<string> {
    const result = await this.client.drive.exportTask.create({
      data: {
        type: 'docx',
        token: fileToken,
        file_extension: fileExtension,
      },
    });

    if (result.code !== 0) {
      throw new Error(
        `createExportTasks: ${result.msg} with source ${fileToken}`,
      );
    }

    return result.data.ticket;
  }

  /**
   * 查询进度  导出任务
   * @param {string} ticket
   * @returns {Promise<string>}
   */
  async queryExportTasks(
    sourceFileToken: string,
    ticket: string,
  ): Promise<string> {
    const result = await this.client.drive.exportTask.get({
      path: {
        ticket,
      },
      params: {
        token: sourceFileToken,
      },
    });

    if (result.code !== 0 || !result.data.result.file_token) {
      throw new Error(
        `queryExportTasks: ${result.msg} with source ${sourceFileToken}`,
      );
    }
    return result.data.result.file_token;
  }

  /**
   * 下载文件
   * @param {string} fileToken
   * @param {string} targetPath
   * @returns {Promise<string>}
   */
  async downloadFile(
    fileToken: string,
    sourceFileToken: string,
    targetPath: string,
  ): Promise<string> {
    try {
      const result = await this.client.drive.exportTask.download({
        path: {
          file_token: fileToken,
        },
      });

      await result.writeFile(targetPath);
    } catch (error) {
      throw new Error(
        `downloadFile: ${error.message} with source ${sourceFileToken}`,
      );
    }

    return targetPath;
  }
}
