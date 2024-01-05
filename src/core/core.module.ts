/**
 * @Author: wbj
 * @Date: 2021-01-07 17:55:28
 * @Last Modified by: wbj
 * @Last Modified time: 2024-01-04 23:08:59
 * @Last Modified reason: 增加全局 filter
 */

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import {
  LoggingInterceptor,
  // WrapResponceInterceptor
} from './interceptors';
import {
  AnyExceptionsFilter,
  BadRequestFilter,
  HttpExceptionFilter,
} from './filters';
import { LoggerModule } from './logger';
import { AppI18nModule } from './i18n';
import { DatabaseModule } from './database';

@Module({
  imports: [LoggerModule, AppI18nModule, DatabaseModule],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    // { provide: APP_INTERCEPTOR, useClass: WrapResponceInterceptor },
    {
      provide: APP_FILTER,
      useClass: AnyExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      /**
       * BadRequest extend HttpException
       * 因此 BadRequest 顺序在最前
       */
      provide: APP_FILTER,
      useClass: BadRequestFilter,
    },
  ],
})
export class CoreModule {}
