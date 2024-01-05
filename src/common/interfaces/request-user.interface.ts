/**
 * 操作、访问用户信息
 */
export interface RequestUser {
  id: number;

  email: string;

  username: string;

  roles: string[];

  ip?: string;
}
