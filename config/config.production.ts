import { Dialect } from 'sequelize/types';
import { join } from 'path';

/**
 * 开发环境配置
 */
export const config = {
  sequelize: {
    username: 'root',
    password: null,
    storage: join(__dirname, '../..', './databases/db/database.sqlite'),
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
  API_V1: 'v1',
  APP_CONFIG: {
    JWT_SECRET: 'xxxkkj123v',
    JWT_SECRET_EXPIRESIN: '10d', // token 过期时间
    KOWNLEDGE_BASE_RESOURCES_ROOT: join(
      __dirname,
      '..',
      '..',
      'resources',
      'prod',
    ),
  },
};
