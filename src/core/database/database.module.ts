import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { config } from '../../../config';

/**
 * 配置参数
 */
const sequelizeConfig = config.sequelize;

/**
 * 数据库模块
 */
const databaseModule = SequelizeModule.forRoot({
  ...sequelizeConfig,
  autoLoadModels: true,
  synchronize: false,
});

@Module({
  imports: [databaseModule],
  exports: [databaseModule],
})
export class DatabaseModule {}
