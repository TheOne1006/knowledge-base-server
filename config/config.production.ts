import { Dialect } from 'sequelize/types';
import { join } from 'path';

/**
 * 生产环境配置
 */
export const config = {
  sequelize: {
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: 'postgres' as Dialect,
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
