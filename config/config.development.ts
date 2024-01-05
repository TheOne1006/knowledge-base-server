import { Dialect } from 'sequelize/types';
import { join } from 'path';

/**
 * 开发环境配置
 */
export const config = {
  sequelize: {
    username: 'root',
    password: null,
    storage: join(__dirname, '../..', './databases/db/database.dev.sqlite'),
    host: 'localhost',
    dialect: 'sqlite' as Dialect,
    logging: false,
  },
  logger: {
    appName: 'example',
    level: 'info',
    timestamp: true,
    // filename: 'log/all.log',
  },
};
