// istanbul ignore file
/**
 * 参考 https://github.com/ischanx/larkdocs2md/
 */
import type { Client } from '@larksuiteoapi/node-sdk';
// import { Client as LarkClient } from '@larksuiteoapi/node-sdk';
import { DocBlock, IMAGE_TRANS_TYPES, IMAGE_TRANS_TYPE_SKIP } from './types';
import { GenerateMarkdown } from './genMd';

export class LarkDocs2Md {
  private larkClient: Client;
  private generateMarkdown: GenerateMarkdown;

  constructor(
    client: Client,
    imgTransType: IMAGE_TRANS_TYPES = IMAGE_TRANS_TYPE_SKIP,
  ) {
    this.larkClient = client;
    this.generateMarkdown = new GenerateMarkdown(this.larkClient, imgTransType);
  }

  /**
   * 循环 获取数据
   * @param {DocBlock[]} blocks
   * @param {string} fileToken
   * @param {string} pageToken
   */
  async loopGetDocxBlocks(
    blocks: DocBlock[],
    fileToken: string,
    pageToken?: string,
  ) {
    const response = await this.larkClient.docx.documentBlock.list({
      path: {
        document_id: fileToken,
      },
      params: {
        page_size: 500, // max
        document_revision_id: -1, // last version
        page_token: pageToken,
      },
    });

    if (!response?.data?.items?.[0]) {
      throw new Error('get blocks list error');
    }

    blocks.push(...(response.data.items as DocBlock[]));

    if (response.data.has_more) {
      const nextPageToken = response.data.page_token;
      await this.loopGetDocxBlocks(blocks, fileToken, nextPageToken);
    }
  }

  /**
   * 获取全员文档信息
   * @param {string} fileToken
   * @returns {Promise<DocBlock[]>}
   */
  async getAllDocxBlocks(fileToken: string): Promise<DocBlock[]> {
    const blocks: DocBlock[] = [];

    await this.loopGetDocxBlocks(blocks, fileToken);

    return blocks;
  }

  async docx2md(fileToken: string): Promise<string> {
    const blocks = await this.getAllDocxBlocks(fileToken);
    return await this.generateMarkdown.buildFromDocs(blocks);
  }

  async wikiInfoDocxBlocks(wikiToken: string): Promise<DocBlock[]> {
    const response = await this.larkClient.wiki.space.getNode({
      params: {
        token: wikiToken,
        obj_type: 'wiki',
      },
    });

    if (!response?.data?.node) {
      throw new Error('get wiki info error');
    }

    const docxTypes = ['docx', 'doc'];
    const currentType = response.data.node.obj_type;
    if (docxTypes.some((item) => item === currentType)) {
      return this.getAllDocxBlocks(response.data.node.obj_token);
    }

    throw new Error(`wikiInfoDoc type: ${currentType} not allow`);
  }

  async wiki2md(wikiToken: string): Promise<string> {
    const blocks = await this.wikiInfoDocxBlocks(wikiToken);
    try {
      return await this.generateMarkdown.buildFromDocs(blocks);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async link2md(link: string): Promise<string> {
    const matchReg = new RegExp(
      '^https://[a-zA-Z0-9-]+.(feishu.cn|larksuite.com|f.mioffice.cn)/(docx|wiki)/([a-zA-Z0-9]+)',
    );

    const matchArr = matchReg.exec(link);

    const type = matchArr[2];
    const tokenId = matchArr[3];

    if (type === 'wiki') {
      return await this.wiki2md(tokenId);
    }
    return await this.docx2md(tokenId);
  }
}
