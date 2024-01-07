import {
  Controller,
  Get,
  Sse,
  MessageEvent,
  Res,
  Body,
  // Post,
  SetMetadata,
  // Response,
} from '@nestjs/common';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common/enums/request-method.enum';
// enums / request - method.enum
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { readFileSync } from 'fs';
import { join } from 'path';
// import { map } from 'rxjs/operators';
import { I18nLang } from 'nestjs-i18n';
// import { HttpResponseOutputParser } from "langchain/output_parsers"
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@I18nLang() lang: string): string {
    return this.appService.getHello(lang);
  }

  @Get('/html')
  index(@Res() response: Response) {
    response
      .type('text/html')
      .send(readFileSync(join(__dirname, 'index.html')).toString());
  }

  @SetMetadata(METHOD_METADATA, RequestMethod.POST)
  @Sse('/steam')
  getSteam(@Body() _something): Observable<MessageEvent> {
    console.log(_something);
    const observable = new Observable<MessageEvent>(function (observer) {
      observer.next({ data: { hello: 'hello', finish: false } });
      observer.next({ data: { hello: 'hello2', finish: false } });
      observer.next({ data: { hello: 'hello3', finish: false } });

      setTimeout(() => {
        observer.next({ data: { hello: 'hello finish', finish: true } });
        observer.complete();
        // 结束流程
      }, 600);
    });

    return observable;
  }
}
