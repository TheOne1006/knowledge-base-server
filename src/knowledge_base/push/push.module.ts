/* istanbul ignore file */
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';

// controllers
import {
  PushConfigController,
  PushMapController,
  PushLogController,
  PushController,
} from './controllers';

// entites
import { PushConfig, PushLog, PushMap } from './entites';

// push services
import {
  PushConfigService,
  PushLogService,
  PushMapService,
  PushProcessService,
} from './services';

import { PushDifyService } from './services/dify';

// kb modules
import { KnowledgeBase } from '../kb/kb.entity';
import { KbService } from '../kb/kb.service';

import { KnowledgeBaseFile } from '../file/file.entity';
import { KbFileService } from '../file/file.service';

@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([
      PushConfig,
      PushLog,
      PushMap,
      KnowledgeBase,
      KnowledgeBaseFile,
    ]),
  ],
  controllers: [
    PushConfigController,
    PushMapController,
    PushMapController,
    PushLogController,
    PushController,
  ],
  providers: [
    PushConfigService,
    PushLogService,
    PushMapService,
    PushProcessService,
    PushDifyService,
    KbFileService,
    KbService,
  ],
})
export class PushModule {}
