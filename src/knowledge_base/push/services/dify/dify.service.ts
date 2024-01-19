import { Injectable, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DifyDocumentDto, DifyDocumentPageDto } from './dify-document.dto';

@Injectable()
export class PushDifyService {
  /**
   * @param httpService nest 默认 httpService
   * @param logger 日志服务
   */
  constructor(
    private readonly httpService: HttpService,
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
  ) {}

  private async createOrUpdateByFile(
    url: string,
    filePath: string,
    apiKey: string,
  ): Promise<DifyDocumentDto> {
    const inputData = {
      name: filePath,
      indexing_technique: 'high_quality',
      process_rule: {
        mode: 'automatic',
      },
    };

    // 根据 filePath 获取文件，然后发送 给 url
    const formData = new FormData();
    const file = fs.createReadStream(filePath);
    formData.append('data', JSON.stringify(inputData) as any);
    formData.append('file', file as any);

    const headers = {
      ...formData.getHeaders(),
      Authorization: `Bearer ${apiKey}`,
    };

    const {
      data: { document },
    } = await firstValueFrom(
      this.httpService
        .post<{ document: DifyDocumentDto }>(url, formData, {
          headers,
        })
        .pipe(
          catchError((error: AxiosError) => {
            const errorData: any = error.response.data;
            this.logger.error(errorData);
            throw Error(errorData.message);
          }),
        ),
    );

    return document;
  }

  /**
   * 创建文档
   * @param {string} url
   * @param {string} filePath
   * @param {string} apiKey
   * @returns
   */
  async createByFile(
    apiUrl: string,
    filePath: string,
    apiKey: string,
  ): Promise<DifyDocumentDto> {
    const url = `${apiUrl}/document/create_by_file`;
    return this.createOrUpdateByFile(url, filePath, apiKey);
  }

  /**
   * 删除某个id的文档
   * @param {string} apiUrl
   * @param {string} documentId
   * @param {string} apiKey
   * @returns
   */
  async deleteByFile(
    apiUrl: string,
    documentId: string,
    apiKey: string,
  ): Promise<string> {
    const url = `${apiUrl}/documents/${documentId}`;
    const { data } = await firstValueFrom(
      this.httpService
        .delete<{ result: string }>(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            const errorData: any = error.response.data;
            this.logger.error(errorData);
            throw Error(errorData.message);
          }),
        ),
    );

    return data.result;
  }

  /**
   * 更新文档
   * @param {string} apiUrl
   * @param {string} documentId
   * @param {string} filePath
   * @param {string} apiKey
   * @returns {Promise<DifyDocumentDto>}
   */
  async UpdateByFile(
    apiUrl: string,
    documentId: string,
    filePath: string,
    apiKey: string,
  ): Promise<DifyDocumentDto> {
    const url = `${apiUrl}/documents/${documentId}/update_by_file`;
    return this.createOrUpdateByFile(url, filePath, apiKey);
  }

  /**
   * 知识库内所有文档
   * @param url
   * @param apiKey
   * @returns
   */
  async queryDocuments(
    apiUrl: string,
    apiKey: string,
  ): Promise<DifyDocumentPageDto> {
    const url = `${apiUrl}/documents`;
    const { data } = await firstValueFrom(
      this.httpService
        .get<DifyDocumentPageDto>(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            const errorData: any = error.response.data;
            this.logger.error(errorData);
            throw Error(errorData.message);
          }),
        ),
    );

    return data;
  }
}
