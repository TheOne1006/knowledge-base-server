import { Exclude } from 'class-transformer';

/**
 * UserDto
 */
export class UserDto {
  id: number;

  username: string;

  email: string;

  roles: string[];

  @Exclude()
  salt: string;

  @Exclude()
  password: string;

  @Exclude()
  ip?: string;

  updatedAt: Date;

  createdAt: Date;

  @Exclude()
  isDeleted: boolean;

  @Exclude()
  version: number;
}
