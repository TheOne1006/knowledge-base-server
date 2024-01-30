// istanbul ignore file
import type { Client } from '@larksuiteoapi/node-sdk';

import {
  DocBlock,
  BlockType,
  TransformContext,
  IMAGE_TRANS_TYPES,
  IMAGE_TRANS_TYPE_SKIP,
} from './types';
import { getBlockData } from './utils';
import { transformBlock } from './parse';

export class GenerateMarkdown {
  larkClient: Client;
  imageTransType: IMAGE_TRANS_TYPES;
  constructor(
    larkClient: Client,
    imageTransType: IMAGE_TRANS_TYPES = IMAGE_TRANS_TYPE_SKIP,
  ) {
    this.larkClient = larkClient;
    this.imageTransType = imageTransType;
  }

  /**
   * 构建 block map
   * @param blocks
   * @returns
   */
  buildBlocksMap(blocks: DocBlock[]): Map<string, DocBlock> {
    const blocksMap = new Map();
    blocks.forEach((block) => {
      blocksMap.set(block.block_id, block);
    });
    return blocksMap;
  }

  async buildFromDocs(blocks: DocBlock[]): Promise<string> {
    /**
     * 获取文档的第一个 page block
     */
    const pageBlock = blocks[0];
    // 解析
    if (pageBlock.block_type !== BlockType.Page) {
      throw new Error('no page block');
    }
    const pageBlockData = getBlockData(pageBlock);

    /**
     * 解析 子 block
     */
    const blocksList = pageBlock.children;
    const blocksMap = this.buildBlocksMap(blocks);
    const docTitle = pageBlockData.elements[0].text_run.content;

    // 为空
    if (!blocksList?.length) {
      return;
    }

    let markdownString = '';
    markdownString += `# ${docTitle}\n\n`;

    const context: TransformContext = {
      blocksMap,
      blocksList,
      larkClient: this.larkClient,
      imageTransType: this.imageTransType,
    };

    for (const blockToken of blocksList) {
      const block = blocksMap.get(blockToken);
      if (!block) {
        continue;
      }
      const text = await transformBlock(block, context);
      if (text) {
        markdownString += text + '\n\n';
      }
    }

    return markdownString;
  }
}
