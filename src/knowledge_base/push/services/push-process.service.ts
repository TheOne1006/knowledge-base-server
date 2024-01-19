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
    if (configIns.type === PUSH_TYPE_DIFY) {
      if (remoteId) {
        return this.updateByFile(remoteId, filePath, configIns);
      }
      return this.createByFile(filePath, configIns);
    } else {
      throw new Error('type is not allow');
    }
  }

  /**
   * 根据文件创建 doc
   * @param filePath
   * @param configIns
   * @returns
   */
  async createByFile(
    filePath: string,
    configIns: PushConfigDto,
  ): Promise<string> {
    if (configIns.type === PUSH_TYPE_DIFY) {
      const doc = await this.pushDifyService.createByFile(
        configIns.apiUrl,
        filePath,
        configIns.apiKey,
      );
      return doc.id;
    } else {
      throw new Error('type is not allow');
    }
  }

  /**
   * 更新推送文件
   * @param remoteId
   * @param filePath
   * @param configIns
   * @returns
   */
  async updateByFile(
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
      );
      return doc.id;
    } else {
      throw new Error('type is not allow');
    }
  }

  /**
   * 删除推送的文件
   * @param remoteId
   * @param configIns
   */
  deleteByFile(remoteId: string, configIns: PushConfigDto) {
    if (configIns.type === PUSH_TYPE_DIFY) {
      this.pushDifyService.deleteByFile(
        configIns.apiUrl,
        remoteId,
        configIns.apiKey,
      );
    } else {
      throw new Error('type is not allow');
    }
  }
}
