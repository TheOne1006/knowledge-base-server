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
 * 将 bktoken 尝试解析成 reqUser
 *
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}
  async use(req: Request, _res: Response, next: NextFunction) {
    const bktoken = (req.headers.bktoken || req.headers.token || '') as string;
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
    if (bktoken.startsWith('_mock')) {
      req['user'] = AuthMiddleware.parseMockToken(bktoken, ip);
      next();
      return;
    }

    req['user'] = await this.authService.check(bktoken, ip);
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
      id: 1001,
      username,
      email: '',
      roles,
      ip,
    };

    return requestUser;
  }
}
