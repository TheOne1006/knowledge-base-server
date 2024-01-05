import { uniq } from 'lodash';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestUser } from '../interfaces';
import { ROLE_SUPER_ADMIN } from '../../common/constants';

/**
 * roles guard
 *
 * 角色访问限制
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(protected readonly reflector: Reflector) {}

  /**
   * 对比用户和所需的角色判断是否能访问方法
   * @param  {ExecutionContext} context
   * @returns boolean
   */
  canActivate(context: ExecutionContext): boolean {
    const allowRoles = this.getRoles(context);
    const request = context.switchToHttp().getRequest();
    const user: RequestUser | undefined = request.user;
    const userRoles = user?.roles || [];

    const isSuperAdmin = this.isSuperAdmin(userRoles);

    /* istanbul ignore next */
    if (isSuperAdmin) {
      return true;
    }

    const allow = this.allowAccess(allowRoles, userRoles);

    return allow;
  }

  /**
   * 获取需要的角色
   *
   * 获取 class 的同时也获取对应 method
   * @param  {ExecutionContext} context
   * @returns string
   */
  protected getRoles(context: ExecutionContext): string[] {
    const methodHandleRoles =
      this.reflector.get<string[]>('roles', context.getHandler()) || [];

    const clsHandleRoles =
      this.reflector.get<string[]>('roles', context.getClass()) || [];

    return uniq([...clsHandleRoles, ...methodHandleRoles]);
  }

  /**
   * 是否为超级管理员
   * @param userRoles
   */
  protected isSuperAdmin(userRoles: string[] = []) {
    return userRoles && userRoles.includes(ROLE_SUPER_ADMIN);
  }

  /**
   * 是否允许继续访问
   *
   * @returns boolean
   */
  protected allowAccess(
    allowRoles: string[] = [],
    userRoles: string[] = [],
  ): boolean {
    return userRoles.some((userRole) =>
      allowRoles.some((needRole) => needRole === userRole),
    );
  }
}
