import { Client } from '@larksuiteoapi/node-sdk';

type PromiseType<T extends Promise<any>> = T extends Promise<infer U>
  ? U
  : never;
type NonArrayType<T> = T extends (infer U)[] ? U : T;

export type WithNodeRep = PromiseType<
  ReturnType<typeof Client.prototype.wiki.space.getNode>
>;

export type WithNode = NonArrayType<WithNodeRep['data']['node']>;
