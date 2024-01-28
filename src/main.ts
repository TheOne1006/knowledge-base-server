/* istanbul ignore file */
import { NestFactory } from '@nestjs/core';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: true, // 强制关闭打开的HTTP连接,用于 steam
  });
  app.setGlobalPrefix('api');

  app.enableShutdownHooks();

  app.useGlobalPipes(new I18nValidationPipe());

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false,
    }),
  );

  // 判断环境
  // if (process.env.NODE_ENV !== 'production') {
  app.enableCors({
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });

  const options = new DocumentBuilder()
    .setTitle('example')
    .setDescription('example API description')
    .setVersion('1.0')
    .addApiKey({
      type: 'apiKey',
      name: 'token',
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/swagger', app, document);
  // }

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
