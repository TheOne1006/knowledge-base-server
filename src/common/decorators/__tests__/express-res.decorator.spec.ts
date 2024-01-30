import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, Get } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { ExpressResponse } from '../express-res.decorator';

describe('ExpressResponse', () => {
  describe('get response', () => {
    const testFoo = jest.fn();
    let matchFun: any;

    class TestClass {
      @Get('foo')
      public testFoo(@ExpressResponse() res: any) {
        testFoo(res);
      }
    }

    beforeAll(() => {
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestClass,
        'testFoo',
      );

      matchFun = (Object.values(metadata)[0] as any).factory;
    });

    it('get express response', () => {
      const context = createMock<ExecutionContext>();
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      context.switchToHttp().getResponse.mockReturnValue(res);

      const actual = matchFun({} as any, context);

      expect(actual).toEqual(res);
    });
  });
});
