import { Exclude } from 'class-transformer';

/**
 * KbSiteDto
 */
export class KbSiteDto {
  id: number;

  title: string;

  desc: string;

  hostname: string;

  startUrls: string[];

  removeSelectors: string[];

  pattern: string;

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
