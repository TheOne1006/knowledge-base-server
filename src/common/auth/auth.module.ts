import {
  Module,
  // HttpModule,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthMiddleware } from './auth.middleware';
import { AuthService } from './auth.service';
import { config } from '../../../config';

@Module({
  imports: [
    // HttpModule,
    // AppRedisModule,
    JwtModule.register({
      global: true,
      secret: config.APP_CONFIG.JWT_SECRET,
      signOptions: {
        expiresIn: config.APP_CONFIG.JWT_SECRET_EXPIRESIN,
      },
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    /**
     * 全局验证支持 authmiddleware
     */
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
