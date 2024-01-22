import { NestMiddleware, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

import { RequestUser } from '../interfaces';

import { Request, Response, NextFunction } from 'express';

/**
 * 用于本地测试 替换为 某一值
 */
const TEST_IP = '10.200.0.45';

/**
 * req.user 中间件
 * 将 token 尝试解析成 reqUser
 *
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}
  async use(req: Request, _res: Response, next: NextFunction) {
    let token = (req.headers.token ||
      req.headers.authorization ||
      '') as string;

    // 解析 Bearer
    if (token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }

    // 获取 ipv4 地址
    let ip = ((req.headers['x-real-ip'] || req.ip || '') as string).replace(
      '::ffff:',
      '',
    );

    /**
     * 本地测试
     */
    if (ip === '::1') {
      ip = TEST_IP;
    }

    // support test
    if (token.startsWith('_mock')) {
      req['user'] = AuthMiddleware.parseMockToken(token, ip);
      next();
      return;
    }

    req['user'] = await this.authService.check(token, ip);
    next();
  }

  /**
   * !! 解析mock token
   * 用于测试
   *
   * @example
   * fetch('/api/to/path', headers: {
   *  token: '_mockAdmin,super-admin,textbooks-admin'
   * });
   *
   * @param mockToken
   * @param ip
   */
  private static parseMockToken(mockToken: string, ip: string): RequestUser {
    /**
     * 测试、开发环境 mock
     */
    const [username, ...roles] = mockToken.split(',');

    const requestUser: RequestUser = {
      id: 1,
      username,
      email: '',
      roles,
      ip,
    };

    return requestUser;
  }
}
