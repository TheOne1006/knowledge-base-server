import { I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { QueryResolver } from 'nestjs-i18n';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// import { LoggerModule } from './core/logger';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        I18nModule.forRoot({
          fallbackLanguage: 'en',
          fallbacks: {
            'en-*': 'en',
            'zh-cn': 'zh-cn',
          },
          loaderOptions: {
            path: path.join(__dirname, '/i18n/'),
            watch: true,
          },
          resolvers: [{ use: QueryResolver, options: ['lang'] }],
        }),
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello('en')).toBe('Hello world');
    });
  });
});
