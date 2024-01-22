import { Exclude } from 'class-transformer';

/**
 * PushLogDto
 */
export class PushLogDto {
  id: number;

  configId: number;

  type: string;

  pushVersion: string;

  ownerId: number;

  kbId: number;

  updatedAt: Date;

  createdAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  version: number;
}
