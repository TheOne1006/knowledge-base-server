import { Exclude } from 'class-transformer';

/**
 * PushMapDto
 */
export class PushMapDto {
  id: number;

  configId: number;

  fileId: number;

  type: string;

  pushVersion: string;

  remoteId: string;

  ownerId: number;

  kbId: number;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  createdAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  version: number;
}
