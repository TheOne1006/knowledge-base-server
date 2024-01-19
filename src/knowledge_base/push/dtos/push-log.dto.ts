import { Exclude } from 'class-transformer';

/**
 * PushLogDto
 */
export class PushLogDto {
  id: number;

  configId: number;

  type: string;

  pushVersion: string;

  status: string;

  ownerId: number;

  kbId: number;

  @Exclude()
  updatedAt: Date;

  createdAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  version: number;
}
