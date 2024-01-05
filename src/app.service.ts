import { Injectable } from '@nestjs/common';
import { I18nService, I18nLang } from 'nestjs-i18n';

/**
 * @ignore
 */
@Injectable()
export class AppService {
  constructor(private readonly i18n: I18nService) {}
  /**
   * @ignore
   */
  getHello(@I18nLang() lang: string): string {
    return this.i18n.t('global.HELLO_MESSAGE', {
      lang,
      args: [{ username: 'world' }],
    });
  }
}
