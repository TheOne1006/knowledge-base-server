/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { RolesGuard } from '../roles.guard';

export const I18nServiceMock = {
  t: jest.fn().mockImplementation((key) => key),
} as any as I18nService;

describe('guard RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'roles') {
        return ['admin'];
      }

      return [];
    }),
  } as any as Reflector;

  beforeEach(() => {
    guard = new RolesGuard(mockReflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('private getRoles', () => {
    it('should match class', () => {
      const context = createMock<ExecutionContext>();
      const req = {
        headers: {},
      };

      class MockClass {
        static mockFun() {
          // pass
        }
      }

      context.switchToHttp().getRequest.mockReturnValue(req);
      context.getHandler.mockReturnValue(MockClass.mockFun);
      context.getClass.mockReturnValue(MockClass);

      const mockReflector = {
        get: jest.fn().mockImplementation((key: string, handle: any) => {
          if (handle === MockClass.mockFun) {
            return [];
          }

          return ['admin'];
        }),
      } as any as Reflector;

      guard = new RolesGuard(mockReflector);

      // @ts-ignore
      const actual = guard.getRoles(context);

      const expected = ['admin'];
      expect(actual).toEqual(expected);
    });

    it('should match empty', () => {
      const context = createMock<ExecutionContext>();
      const req = {
        headers: {},
      };

      class MockClass {
        static mockFun() {
          // pass
        }
      }

      context.switchToHttp().getRequest.mockReturnValue(req);
      context.getHandler.mockReturnValue(MockClass.mockFun);
      context.getClass.mockReturnValue(MockClass);

      const mockReflector = {
        get: jest.fn().mockImplementation((key: string, handle: any) => {
          if (handle === MockClass.mockFun) {
            return null;
          }

          return null;
        }),
      } as any as Reflector;

      guard = new RolesGuard(mockReflector);

      // @ts-ignore
      const actual = guard.getRoles(context);

      const expected = [];
      expect(actual).toEqual(expected);
    });

    it('should get all and unique', () => {
      const context = createMock<ExecutionContext>();
      const req = {
        headers: {},
      };

      class MockClass {
        static mockFun() {
          // pass
        }
      }

      context.switchToHttp().getRequest.mockReturnValue(req);
      context.getHandler.mockReturnValue(MockClass.mockFun);
      context.getClass.mockReturnValue(MockClass);

      const mockReflector = {
        get: jest.fn().mockImplementation((key: string, handle: any) => {
          if (handle === MockClass.mockFun) {
            return ['admin', 'c1'];
          }

          return ['admin', 'c2'];
        }),
      } as any as Reflector;

      guard = new RolesGuard(mockReflector);

      // @ts-ignore
      const actual = guard.getRoles(context);

      const expected = ['admin', 'c2', 'c1'];
      expect(actual).toEqual(expected);
    });
  });

  describe('canActivate', () => {
    it('should return false if empty user', () => {
      const context = createMock<ExecutionContext>();
      const req = {
        user: undefined,
      };
      context.switchToHttp().getRequest.mockReturnValue(req);

      const actual = guard.canActivate(context);
      expect(actual).toEqual(false);
    });

    it('should return false if empty roles', () => {
      const context = createMock<ExecutionContext>();
      const req = {
        user: {
          roles: [],
        },
      };
      context.switchToHttp().getRequest.mockReturnValue(req);

      const actual = guard.canActivate(context);

      expect(actual).toEqual(false);
    });

    it('should return false if unmatch roles', () => {
      const context = createMock<ExecutionContext>();
      const req = {
        user: {
          roles: ['other'],
        },
      };
      context.switchToHttp().getRequest.mockReturnValue(req);

      const actual = guard.canActivate(context);

      expect(actual).toEqual(false);
    });

    it('should return true if match roles', () => {
      const context = createMock<ExecutionContext>();
      const req = {
        user: {
          roles: ['admin'],
        },
      };
      context.switchToHttp().getRequest.mockReturnValue(req);

      const actual = guard.canActivate(context);

      expect(actual).toBeTruthy();
    });
  });

  describe('isSuperAdmin()', () => {
    it('return true', () => {
      const mockReflector = {} as any as Reflector;

      guard = new RolesGuard(mockReflector);

      const userRoles = ['user', 'super-admin', 'user'];

      // @ts-ignore
      const actual = guard.isSuperAdmin(userRoles);

      const expected = true;
      expect(actual).toEqual(expected);
    });

    it('return false', () => {
      const mockReflector = {} as any as Reflector;

      guard = new RolesGuard(mockReflector);

      const userRoles = ['user', 'super-2admin'];

      // @ts-ignore
      const actual = guard.isSuperAdmin(userRoles);

      const expected = false;
      expect(actual).toEqual(expected);
    });
  });

  describe('allowAccess()', () => {
    it('match success', () => {
      const mockReflector = {} as any as Reflector;

      guard = new RolesGuard(mockReflector);

      const allowRoles = ['admin', 'admin3'];

      const userRoles = ['admin', 'user'];

      // @ts-ignore
      const actual = guard.allowAccess(allowRoles, userRoles);

      const expected = true;
      expect(actual).toEqual(expected);
    });

    it('unmatch', () => {
      const mockReflector = {} as any as Reflector;

      guard = new RolesGuard(mockReflector);

      const allowRoles = ['admin', 'admin3'];

      const userRoles = ['admin1', 'user'];

      // @ts-ignore
      const actual = guard.allowAccess(allowRoles, userRoles);

      const expected = false;
      expect(actual).toEqual(expected);
    });
  });
});
