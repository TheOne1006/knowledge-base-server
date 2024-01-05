import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
// import * as Redis from 'ioredis';
// import { RedisService } from 'nestjs-redis';
import { JwtService } from '@nestjs/jwt';
import { RequestUser } from '../interfaces';

/**
 * 用户认证
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private jwtService: JwtService,
  ) {}

  async create_token(payload: RequestUser) {
    return this.jwtService.signAsync(payload);
  }

  /**
   * 检查 token
   *
   * @param  {string} token
   * @param  {string} ip
   * @returns Promise
   */
  async check(token: string, ip: string): Promise<RequestUser> {
    const user = {
      id: null,
      username: '',
      email: '',
      roles: [],
      ip,
    } as RequestUser;

    if (!token) {
      return user;
    }

    try {
      const token_user = await this.jwtService.verifyAsync(token);
      user.id = token_user.id;
      user.username = token_user.username;
      user.email = token_user.email;
      user.roles = token_user.roles;
    } catch (error) {
      this.logger.error('jwt decode error with:', token, ip);
    }
    return user;
  }
}
