/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createMock } from '@golevelup/ts-jest';
import { Get, UseInterceptors, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { Exclude } from 'class-transformer';
import { Reflector } from '@nestjs/core';
import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';

import { SerializerInterceptor } from '../serializer.interceptor';
import { SerializerClass } from '../../decorators';
import { SERIALIZER_CLASS, CLASS_SERIALIZER_OPTIONS } from '../../constants';

describe('Interceptor SerializerInterceptor', () => {
  describe('intercept()', () => {
    const mockReturn = jest.fn().mockReturnValueOnce({
      id: 'id',
      type: 'mock',
    });

    class MockSerializerClass {
      id: string;

      type: string;
    }

    class TestClass {
      @Get('/foo')
      @UseInterceptors(SerializerInterceptor)
      @SerializerClass(MockSerializerClass)
      static foo(path: string) {
        return mockReturn(path);
      }
    }

    it('should support match interceptor', () => {
      const metadata = Reflect.getMetadata(
        INTERCEPTORS_METADATA,
        TestClass.foo,
      );

      expect(metadata[0]).toEqual(SerializerInterceptor);
    });
  });

  describe('intercept2()', () => {
    class MockPlanClass {
      id: number;

      name: string;

      @Exclude()
      exclude: string;
    }

    const mockReflector = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === SERIALIZER_CLASS) {
          return MockPlanClass;
        } else if (key === CLASS_SERIALIZER_OPTIONS) {
          return {};
        }
      }),
    } as any as Reflector;

    const context = createMock<ExecutionContext>();

    it('should intercept', async () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const result = {
        id: '123',
        name: 'mock result',
      };

      const next = {
        handle: () => of(result),
      } as any;

      const actual = interceptor.intercept(context, next);

      const actualSubscribe = await new Promise((resolve) => {
        actual.subscribe((value) => {
          resolve(value);
        });
      });

      const expected = {
        id: '123',
        name: 'mock result',
      };

      expect(actualSubscribe).toEqual(expected);
      expect(actualSubscribe).toBeInstanceOf(MockPlanClass);
    });

    it('should support loss planClass', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDoc = {
        id: 1,
        name: 'mock',
        exclude: 'exclude',
      };

      const actual = interceptor.serialize(mockDoc, {});

      const expected = {
        id: 1,
        name: 'mock',
        exclude: 'exclude',
      };

      expect(actual).toEqual(expected);
      expect(actual instanceof MockPlanClass).toBeFalsy();
    });

    it('should support array', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDocs = [
        {
          toJSON: () => ({
            id: 1,
            name: 'mock',
            exclude: 'exclude',
          }),
        },
        {
          toJSON: () => ({
            id: 2,
            name: 'mock2',
            exclude: 'exclude',
          }),
        },
      ];

      const actual = interceptor.serialize(mockDocs, {
        planClass: MockPlanClass,
      });

      const expected = [
        {
          id: 1,
          name: 'mock',
        },
        {
          id: 2,
          name: 'mock2',
        },
      ];

      expect(actual).toEqual(expected);
      expect(actual[0]).toBeInstanceOf(MockPlanClass);
      expect(actual[1]).toBeInstanceOf(MockPlanClass);
    });

    it('should support PlainLiteralObject', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDoc = {
        id: 1,
        name: 'mock',
        exclude: 'exclude',
      };

      const actual = interceptor.serialize(mockDoc, {
        planClass: MockPlanClass,
      });

      const expected = {
        id: 1,
        name: 'mock',
      };

      expect(actual).toEqual(expected);
      expect(actual).toBeInstanceOf(MockPlanClass);
    });
  });

  describe('serialize()', () => {
    const mockReflector = {
      get: jest.fn(),
    } as any as Reflector;

    class MockPlanClass {
      id: number;

      name: string;

      @Exclude()
      exclude: string;
    }

    it('should support string', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDoc = 'html' as any;

      const actual = interceptor.serialize(mockDoc, {});

      const expected = 'html';

      expect(actual).toEqual(expected);
    });

    it('should support loss planClass', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDoc = {
        id: 1,
        name: 'mock',
        exclude: 'exclude',
      };

      const actual = interceptor.serialize(mockDoc, {});

      const expected = {
        id: 1,
        name: 'mock',
        exclude: 'exclude',
      };

      expect(actual).toEqual(expected);
      expect(actual instanceof MockPlanClass).toBeFalsy();
    });

    it('should support array', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDocs = [
        {
          toJSON: () => ({
            id: 1,
            name: 'mock',
            exclude: 'exclude',
          }),
        },
        {
          toJSON: () => ({
            id: 2,
            name: 'mock2',
            exclude: 'exclude',
          }),
        },
      ];

      const actual = interceptor.serialize(mockDocs, {
        planClass: MockPlanClass,
      });

      const expected = [
        {
          id: 1,
          name: 'mock',
        },
        {
          id: 2,
          name: 'mock2',
        },
      ];

      expect(actual).toEqual(expected);
      expect(actual[0]).toBeInstanceOf(MockPlanClass);
      expect(actual[1]).toBeInstanceOf(MockPlanClass);
    });

    it('should support PlainLiteralObject', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDoc = {
        id: 1,
        name: 'mock',
        exclude: 'exclude',
      };

      const actual = interceptor.serialize(mockDoc, {
        planClass: MockPlanClass,
      });

      const expected = {
        id: 1,
        name: 'mock',
      };

      expect(actual).toEqual(expected);
      expect(actual).toBeInstanceOf(MockPlanClass);
    });
  });

  describe('transformPlainToClass()', () => {
    const mockReflector = {
      get: jest.fn(),
    } as any as Reflector;

    class MockPlanClass {
      id: number;

      name: string;

      @Exclude()
      exclude: string;
    }

    it('should transform success', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDoc = {
        toJSON: () => ({
          id: 1,
          name: 'mock',
          exclude: 'exclude',
        }),
      };

      const actual = interceptor.transformPlainToClass(
        MockPlanClass,
        mockDoc,
        {},
      );

      const expected = { id: 1, name: 'mock' };

      expect(actual).toEqual(expected);
      expect(actual).toBeInstanceOf(MockPlanClass);
    });
  });

  describe('jsonFormatDocument()', () => {
    const mockReflector = {
      get: jest.fn(),
    } as any as Reflector;

    it('should has toJSON function', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDoc = {
        toJSON: () => ({
          id: 1,
          name: 'mock',
        }),
      };

      const actual = interceptor.jsonFormatDocument(mockDoc);

      const expected = { id: 1, name: 'mock' };

      expect(actual).toEqual(expected);
    });

    it('should without toJSON', () => {
      const interceptor = new SerializerInterceptor(mockReflector);

      const mockDoc = {
        id: 5,
        name: 'c',
      };

      const actual = interceptor.jsonFormatDocument(mockDoc);

      const expected = { id: 5, name: 'c' };

      expect(actual).toEqual(expected);
    });
  });

  describe('_getContextOptions()', () => {
    const mockGetter = jest
      .fn()
      .mockReturnValueOnce('first')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('thrid');
    const mockReflector = {
      get: mockGetter,
    } as any as Reflector;

    it('should return options in getHandler', () => {
      const context = createMock<ExecutionContext>();

      const interceptor = new SerializerInterceptor(mockReflector);

      // @ts-ignore
      const actual = interceptor._getContextOptions(context, 'same');

      const expected = 'first';

      expect(actual).toEqual(expected);
    });

    it('should return options in getClass', () => {
      const context = createMock<ExecutionContext>();

      const interceptor = new SerializerInterceptor(mockReflector);

      // @ts-ignore
      const actual = interceptor._getContextOptions(context, 'same');

      const expected = 'thrid';

      expect(actual).toEqual(expected);
    });
  });
});
