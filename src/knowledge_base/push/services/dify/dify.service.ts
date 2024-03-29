import { Injectable, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DifyDocumentDto, DifyDocumentPageDto } from './dify-document.dto';
import { PushConfigDto } from '../../dtos';

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

  /**
   * 校验 config 数据
   * @param {PushConfigDto} configIns
   */
  checkConfig(configIns: PushConfigDto) {
    // 校验额外规则
    if (configIns.additional?.proccess_rules) {
      const proccess_rules = configIns.additional.proccess_rules;
      // 判断 为字典类型configIns.additional?.proccess_rules
      if (
        typeof proccess_rules === 'object' &&
        !(proccess_rules instanceof Array) &&
        !(proccess_rules instanceof Date)
      ) {
        // is true
      } else {
        throw new Error('additional.proccess_rules is not allow');
      }
    }
  }

  getProccessRules(data: PushConfigDto['additional']) {
    if (data?.proccess_rules) {
      return data.proccess_rules;
    }
    return {};
  }

  /**
   * 创建或更新文档
   * @param {string} url
   * @param {string} filePath
   * @param {string} apiKey
   * @param {any} process_rule
   * @returns {Promise<DifyDocumentDto>}
   */
  private async createOrUpdateByFile(
    url: string,
    filePath: string,
    apiKey: string,
    process_rule: { [key: string]: any } = {},
  ): Promise<DifyDocumentDto> {
    // filePath 重命名 移除掉 / 使用
    const inputData = {
      process_rule: {
        mode: 'automatic',
        ...process_rule,
      },
      name: filePath,
      indexing_technique: 'high_quality',
    };

    // 校验 filePath
    if (!fs.existsSync(filePath)) {
      throw Error(`file not exists: ${filePath}`);
    }

    this.logger.info(
      `createOrUpdateByFile: ${url}, with ${JSON.stringify(
        inputData,
        null,
        2,
      )}`,
    );

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
            // console.log('error>>>');
            // console.log(error.response.data);
            const errorData: any = error.response?.data;
            this.logger.error('error:', errorData, ' with endpoint:', url);
            throw Error(`错误 with ${url}, ${apiKey}, ${errorData?.message}`);
          }),
        ),
    );

    return document;
  }

  /**
   * 创建文档
   * @param {string} apiUrl
   * @param {string} filePath
   * @param {string} apiKey
   * @param {any} additional
   * @returns
   */
  async createByFile(
    apiUrl: string,
    filePath: string,
    apiKey: string,
    additional: { [key: string]: any },
  ): Promise<DifyDocumentDto> {
    const url = `${apiUrl}/document/create_by_file`;
    const process_rule = this.getProccessRules(additional);
    return this.createOrUpdateByFile(url, filePath, apiKey, process_rule);
  }

  /**
   * 删除某个id的文档
   * @param {string} apiUrl
   * @param {string} documentId
   * @param {string} apiKey
   * @returns {string}
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
            this.logger.error('error:', errorData, ' with endpoint:', url);
            throw Error(`错误 with ${url}, ${apiKey}, ${errorData?.message}`);
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
  async updateByFile(
    apiUrl: string,
    documentId: string,
    filePath: string,
    apiKey: string,
    additional: { [key: string]: any },
  ): Promise<DifyDocumentDto> {
    const url = `${apiUrl}/documents/${documentId}/update_by_file`;
    const process_rule = this.getProccessRules(additional);
    return this.createOrUpdateByFile(url, filePath, apiKey, process_rule);
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
    keyword?: string,
    page?: number,
    limit: number = 20,
  ): Promise<DifyDocumentPageDto> {
    const url = `${apiUrl}/documents`;
    const query = {
      keyword,
      page,
      limit: Math.min(limit, 100),
    };
    const { data } = await firstValueFrom(
      this.httpService
        .get<DifyDocumentPageDto>(url, {
          params: query,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            const errorData: any = error.response.data;
            this.logger.error('error:', errorData, ' with endpoint:', url);
            throw Error(`错误 with ${url}, ${apiKey}, ${errorData?.message}`);
          }),
        ),
    );

    return data;
  }

  /**
   * 获取全部文档
   * @param apiUrl
   * @param apiKey
   * @param keyword
   * @returns {Promise<DifyDocumentPageDto[]>}
   */
  async queryAllDocuments(
    apiUrl: string,
    apiKey: string,
    keyword?: string,
  ): Promise<DifyDocumentDto[]> {
    const limit = 100;
    const firstPage = await this.queryDocuments(
      apiUrl,
      apiKey,
      keyword,
      1,
      limit,
    );
    const { total } = firstPage;
    const pages = Math.ceil(total / limit);

    const promises: Promise<DifyDocumentDto[]>[] = [];
    for (let i = 2; i <= pages; i++) {
      promises.push(
        this.queryDocuments(apiUrl, apiKey, keyword, i, limit).then(
          (page) => page.data,
        ),
      );
    }

    const allDocuments = await Promise.all(promises).then((results) =>
      results.flat(),
    );

    return [...firstPage.data, ...allDocuments];
  }
}
