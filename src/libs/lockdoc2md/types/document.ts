// istanbul ignore file
import { Client } from '@larksuiteoapi/node-sdk';

type PromiseType<T extends Promise<any>> = T extends Promise<infer U>
  ? U
  : never;
type NonArrayType<T> = T extends (infer U)[] ? U : T;

export type documentBlockListRep = PromiseType<
  ReturnType<typeof Client.prototype.docx.documentBlock.list>
>;

export type DocBlock = NonArrayType<documentBlockListRep['data']['items']>;
