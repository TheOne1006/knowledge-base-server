import { Module } from '@nestjs/common';
import * as path from 'path';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import { config } from '../../../config';

/**
 * i18n 路径
 * 注意: 与 dist 中的目录保持一致
 *
 */
const i18nFilePath = path.join(__dirname, '..', '..', 'i18n');
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: config.language,
      fallbacks: {
        'en-*': 'en',
        'zh-cn': 'zh-cn',
      },
      loaderOptions: {
        path: i18nFilePath,
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  controllers: [],
})
export class AppI18nModule {}
