// istanbul ignore file
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

  matchPatterns: string[];

  ignorePatterns: string[];

  evaluate: string;

  engineType: string;

  fileSuffix: string;

  ownerId: number;

  kbId: number;

  updatedAt: Date;

  createdAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  version: number;
}
