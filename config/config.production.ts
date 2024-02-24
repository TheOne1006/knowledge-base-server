import { Dialect } from 'sequelize/types';
import { join } from 'path';

/**
 * 生产环境配置
 */
export const config = {
  sequelize: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT as Dialect,
    logging: false,
  },
  logger: {
    appName: 'kb-server',
    level: 'info',
    timestamp: true,
    // filename: 'log/all.log',
  },
  API_V1: 'v1',
  APP_CONFIG: {
    JWT_SECRET: 'sksjdkjakjuuyqqwqxxzffqqwewewqqwe',
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
