import { RequestUser } from '../../common/interfaces/request-user.interface';
/**
 * LoginedUserDto
 */
export class LoginedUserDto implements RequestUser {
  id: number;

  email: string;

  username: string;

  roles: string[];

  token: string;
}
