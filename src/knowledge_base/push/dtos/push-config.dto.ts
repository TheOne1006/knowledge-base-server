import { Exclude } from 'class-transformer';

/**
 * PushConfigDto
 */
export class PushConfigDto {
  id: number;

  title: string;

  desc: string;

  type: string;

  apiKey: string;

  apiUrl: string;

  ownerId: number;

  kbId: number;

  additional: Record<string, any> = {};

  updatedAt: Date;

  createdAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  version: number;
}
