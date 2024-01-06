import { Exclude } from 'class-transformer';

/**
 * KbFileDto
 */
export class KbFileDto {
  id: number;

  filePath: string;

  fileExt: string;

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
