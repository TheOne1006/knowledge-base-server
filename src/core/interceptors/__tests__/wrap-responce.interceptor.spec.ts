/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { createMock } from '@golevelup/ts-jest';
import { WrapResponceInterceptor } from '../wrap-responce.interceptor';

describe('core/interceptor logging.interceptor', () => {
  let mockReflector: Reflector;
  let mockContext: ExecutionContext;
  let mockNext: CallHandler;

  beforeEach(() => {
    mockContext = createMock<ExecutionContext>();

    mockNext = {
      handle: () => of(['a', 'b']),
    } as any as CallHandler;
  });

  describe('getMetaData()', () => {
    let interceptor: WrapResponceInterceptor<any>;

    beforeAll(() => {
      mockReflector = {
        get: jest
          .fn()
          .mockReturnValueOnce('')
          .mockReturnValueOnce('meta')
          .mockReturnValueOnce('meta')
          .mockReturnValueOnce(0),
      } as any as Reflector;

      interceptor = new WrapResponceInterceptor(mockReflector);
    });

    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should get getMetaData in class', async () => {
      const context = createMock<ExecutionContext>();

      // @ts-ignore
      const actual = interceptor.getMetaData('meta', context);
      const expected = 'meta';
      expect(actual).toEqual(expected);
    });

    it('should get getMetaData in handle method', async () => {
      const context = createMock<ExecutionContext>();

      // @ts-ignore
      const actual = interceptor.getMetaData('meta', context);
      const expected = 'meta';
      expect(actual).toEqual(expected);
    });

    it('should get getMetaData support zero', async () => {
      const context = createMock<ExecutionContext>();

      // @ts-ignore
      const actual = interceptor.getMetaData('meta', context);
      const expected = 0;
      expect(actual).toEqual(expected);
    });
  });

  describe('intercept', () => {
    let interceptor: WrapResponceInterceptor<any>;

    beforeAll(() => {
      mockReflector = {
        get: jest.fn(),
      } as any as Reflector;

      interceptor = new WrapResponceInterceptor(mockReflector);
    });

    it('should wrap response', async () => {
      const observabler = interceptor.intercept(mockContext, mockNext);

      const actual = await observabler.toPromise();
      const expected = {
        code: 0,
        message: 'success',
        data: ['a', 'b'],
      };
      expect(actual).toEqual(expected);
    });
  });
});
