import { Exclude } from 'class-transformer';

/**
 * kbDto
 */
export class KbDto {
  id: number;

  title: string;

  desc: string;

  fileCount: number;

  ownerId: number;

  updatedAt: Date;

  createdAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  version: number;
}
