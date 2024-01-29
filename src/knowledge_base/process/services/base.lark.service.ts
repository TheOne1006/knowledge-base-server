// 参考 https://github.com/ischanx/larkdocs2md/blob/main/libs/larkdocs2md/src/main.ts
// import { Logger } from 'winston';
// import { Logger } from '@nestjs/common';
import { Client, LoggerLevel } from '@larksuiteoapi/node-sdk';

import { config } from '../../../../config';

export class BaseLarkService {
  private client: Client;
  private fileExtension: string;

  constructor(exportFileExtension: string, level: LoggerLevel = 3) {
    this.client = new Client({
      appId: config.FEISHU.appId,
      appSecret: config.FEISHU.appSecret,
      loggerLevel: level, // default 3 ; debug 4
    });
    this.fileExtension = exportFileExtension;
  }

  /**
   * 创建 导出任务
   * @param {string} fileToken
   * @returns {Promise<string>}
   */
  async createExportTasks(fileToken: string): Promise<string> {
    const result = await this.client.drive.exportTask.create({
      data: {
        type: 'docx',
        token: fileToken,
        file_extension: this.fileExtension as any,
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
