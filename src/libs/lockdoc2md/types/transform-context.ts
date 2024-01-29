import { DocBlock } from './document';
import { IMAGE_TRANS_TYPES } from './image-trans-type';
import type { Client } from '@larksuiteoapi/node-sdk';

export interface TransformContext {
  blocksMap: Map<string, DocBlock>;
  blocksList: string[];
  larkClient: Client;
  imageTransType: IMAGE_TRANS_TYPES;
}
