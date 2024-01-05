import {
  HttpException,
  ArgumentsHost,
  ExecutionContext,
  ExceptionFilter,
} from '@nestjs/common';
import { Logger } from 'winston';
import { I18nService } from 'nestjs-i18n';
import { createMock } from '@golevelup/ts-jest';

import { BaseExceptionsFilter } from '../base-exception.filter';

class MockBaseExceptionsFilter
  extends BaseExceptionsFilter
  implements ExceptionFilter {}

describe('filters base-exception.filter', () => {
  let mockI18n: I18nService;
  let mockLogger: Logger;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as any as Logger;
    mockI18n = {
      translate: jest.fn(),
    } as any as I18nService;

    const context = createMock<ExecutionContext>();

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue(context),
    } as any as ArgumentsHost;
  });

  describe('catch', () => {
    it('should ouput with exception', () => {
      const filter = new MockBaseExceptionsFilter(mockLogger, mockI18n);

      filter.output = jest.fn();

      const err = new HttpException('err', 204);

      try {
        filter.catch(err, mockHost);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    });
  });
});
