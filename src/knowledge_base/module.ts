/* istanbul ignore file */
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// kb
import { KbController } from './kb/kb.controller';
import { KnowledgeBase } from './kb/kb.entity';
import { KbService } from './kb/kb.service';

// site
import { KbSiteController } from './site/site.controller';
import { KnowledgeBaseSite } from './site/site.entity';
import { KbSiteService } from './site/site.service';

// file
import { KbFileController } from './file/file.controller';
import { KnowledgeBaseFile } from './file/file.entity';
import { KbFileService } from './file/file.service';

// process
import { KbResourceController } from './process/resource.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      KnowledgeBase,
      KnowledgeBaseSite,
      KnowledgeBaseFile,
    ]),
  ],
  controllers: [
    KbController,
    KbSiteController,
    KbFileController,
    KbResourceController,
  ],
  providers: [KbService, KbSiteService, KbFileService],
})
export class KnowledgeBaseModule {}
