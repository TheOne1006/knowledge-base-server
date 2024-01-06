/* istanbul ignore file */
import { Module } from '@nestjs/common';

// import {
//   utilities as nestWinstonModuleUtilities,
//   WinstonModule,
// } from 'nest-winston';
import { CoreModule } from './core/core.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './user/user.module';
import { KnowledgeBaseModule } from './knowledge_base/module';

@Module({
  imports: [CoreModule, UsersModule, KnowledgeBaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
