import { Exclude } from 'class-transformer';

/**
 * KbFileDto
 */
export class KbFileDto {
  id: number;

  filePath: string;

  fileExt: string;

  ownerId: number;

  sourceType: string;

  sourceUrl: string;

  summary: string;

  kbId: number;

  siteId?: number;

  updatedAt: Date;

  createdAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  version: number;
}
