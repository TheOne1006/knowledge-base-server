import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, Get } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { User } from '../user.decorator';

describe('decorator User', () => {
  describe('get request users', () => {
    const testFoo = jest.fn();
    let matchFun: any;

    class TestClass {
      @Get('foo')
      public testFoo(@User() user: any) {
        testFoo(user);
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

    it('get request users', () => {
      const context = createMock<ExecutionContext>();
      const req = {
        user: {
          id: 'u1000',
          username: 'username',
        },
      };
      context.switchToHttp().getRequest.mockReturnValue(req);

      const actual = matchFun({} as any, context);

      const expected = {
        id: 'u1000',
        username: 'username',
      };
      expect(actual).toEqual(expected);
    });
  });
});
