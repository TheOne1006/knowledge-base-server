import { Controller, Get } from '@nestjs/common';
import { I18nLang } from 'nestjs-i18n';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@I18nLang() lang: string): string {
    return this.appService.getHello(lang);
  }
}
