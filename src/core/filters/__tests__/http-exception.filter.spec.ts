import { HttpException, ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { Logger } from 'winston';
import { I18nService } from 'nestjs-i18n';
import { createMock } from '@golevelup/ts-jest';

import { HttpExceptionFilter } from '../http-exception.filter';

describe('filters http-exception.filter', () => {
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
    it('should ouput status with exception', () => {
      const filter = new HttpExceptionFilter(mockLogger, mockI18n);

      filter.output = jest.fn();

      const err = new HttpException('err', 204);

      filter.catch(err, mockHost);

      expect(mockLogger.error).toHaveBeenCalledTimes(2);
      expect(filter.output).toHaveBeenCalledTimes(1);
    });
  });
});
