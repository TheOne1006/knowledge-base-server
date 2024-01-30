import { Inject, Injectable } from '@nestjs/common';
import { PushDifyService } from './dify';
import { PushConfigDto } from '../dtos';
import { PUSH_TYPE_DIFY } from '../constants';

@Injectable()
export class PushProcessService {
  constructor(
    @Inject(PushDifyService)
    private readonly pushDifyService: PushDifyService,
  ) {}

  /**
   * 校验 config 数据
   * @param configIns
   */
  private checkConfig(configIns: PushConfigDto) {
    if (!configIns.apiUrl || !configIns.apiKey) {
      throw new Error('apiUrl or apiKey is not allow empty');
    }

    if (configIns.type === PUSH_TYPE_DIFY) {
      this.pushDifyService.checkConfig(configIns);
    } else {
      throw new Error('type is not allow');
    }
  }

  /**
   * 推送文件，根据 remoteId 判断是创建还是更新
   * @param filePath
   * @param configIns
   * @param remoteId
   * @returns
   */
  async pushByFile(
    filePath: string,
    configIns: PushConfigDto,
    remoteId?: string,
  ): Promise<string> {
    this.checkConfig(configIns);
    if (configIns.type === PUSH_TYPE_DIFY) {
      if (remoteId) {
        return this.updateByFile(remoteId, filePath, configIns);
      }
      return this.createByFile(filePath, configIns);
    }
  }

  /**
   * 根据文件创建 doc
   * @param filePath
   * @param configIns
   * @returns
   */
  private async createByFile(
    filePath: string,
    configIns: PushConfigDto,
  ): Promise<string> {
    if (configIns.type === PUSH_TYPE_DIFY) {
      const doc = await this.pushDifyService.createByFile(
        configIns.apiUrl,
        filePath,
        configIns.apiKey,
        configIns.additional,
      );
      return doc.id;
    }
  }

  /**
   * 更新推送文件
   * @param remoteId
   * @param filePath
   * @param configIns
   * @returns
   */
  private async updateByFile(
    remoteId: string,
    filePath: string,
    configIns: PushConfigDto,
  ) {
    if (configIns.type === PUSH_TYPE_DIFY) {
      const doc = await this.pushDifyService.updateByFile(
        configIns.apiUrl,
        remoteId,
        filePath,
        configIns.apiKey,
        configIns.additional,
      );
      return doc.id;
    }
  }

  /**
   * 删除推送的文件
   * @param remoteId
   * @param configIns
   */
  async deleteByFile(remoteId: string, configIns: PushConfigDto) {
    this.checkConfig(configIns);
    if (configIns.type === PUSH_TYPE_DIFY) {
      await this.pushDifyService.deleteByFile(
        configIns.apiUrl,
        remoteId,
        configIns.apiKey,
      );
    }
  }

  /**
   * 获取全部的 document ids
   * @param configIns
   * @returns
   */
  async getAllRemoteIds(configIns: PushConfigDto): Promise<string[]> {
    this.checkConfig(configIns);
    if (configIns.type === PUSH_TYPE_DIFY) {
      const docs = await this.pushDifyService.queryAllDocuments(
        configIns.apiUrl,
        configIns.apiKey,
      );
      return docs.map((item) => item.id);
    }
  }
}
