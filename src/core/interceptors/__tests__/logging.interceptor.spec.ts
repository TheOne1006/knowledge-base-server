import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Logger } from 'winston';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { createMock } from '@golevelup/ts-jest';

import { LoggingInterceptor } from '../logging.interceptor';

describe('core/interceptor logging.interceptor', () => {
  let mockLogger: Logger;
  let mockContext: ExecutionContext;
  let mockNext: CallHandler;

  beforeEach(() => {
    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as any as Logger;

    mockContext = createMock<ExecutionContext>();

    mockNext = {
      handle: () => of('result'),
    } as any as CallHandler;
  });

  describe('intercept', () => {
    it('should logger nothing', async () => {
      const interceptor = new LoggingInterceptor(mockLogger);

      const observabler = interceptor.intercept(mockContext, mockNext);

      await observabler.toPromise();

      expect(mockLogger.warn).toHaveBeenCalledTimes(0);
    });

    it('should logger warn when useTime gt ACCESS_LIMIT', async () => {
      const interceptor = new LoggingInterceptor(mockLogger);
      mockNext = {
        handle: () => of('result').pipe(delay(500)),
      } as any as CallHandler;

      const observabler = interceptor.intercept(mockContext, mockNext);

      await observabler.toPromise();

      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    });
  });
});
