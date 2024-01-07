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

  @Exclude()
  updatedAt: Date;

  @Exclude()
  createdAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  version: number;
}
