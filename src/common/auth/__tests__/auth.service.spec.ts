/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockLogger: Logger;
  let mockJwtService: JwtService;

  beforeAll(async () => {
    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as any as Logger;

    mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as any as JwtService;

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        AuthService,
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
  });

  describe('base test', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // TODO: check
  describe('check()', () => {
    beforeEach(async () => {
      mockLogger = {
        error: jest.fn(),
      } as any as Logger;

      mockJwtService = {
        signAsync: jest.fn(),
        verifyAsync: jest.fn().mockImplementation(() => ({
          username: 'uname',
          email: '',
          id: 'uid100',
          roles: ['authenticated', 'super-admin'],
        })),
      } as any as JwtService;

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [],
        providers: [
          AuthService,
          {
            provide: WINSTON_MODULE_NEST_PROVIDER,
            useValue: mockLogger,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
        ],
      }).compile();

      service = moduleRef.get<AuthService>(AuthService);
    });

    it('should return empty user with empty token', async () => {
      // @ts-ignore
      const actual = await service.check('', '127.0.0.1');
      const expected = {
        id: null,
        username: '',
        email: '',
        roles: [],
        ip: '127.0.0.1',
      };

      expect(actual).toEqual(expected);
    });

    it('should successfly with some roles', async () => {
      // @ts-ignore
      const actual = await service.check('token', '127.0.0.1');

      const expected = {
        username: 'uname',
        email: '',
        id: 'uid100',
        roles: ['authenticated', 'super-admin'],
        ip: '127.0.0.1',
      };

      expect(actual).toEqual(expected);
    });
  });
});
