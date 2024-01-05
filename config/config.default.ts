import { Dialect } from 'sequelize/types';
import { join } from 'path';

/**
 * @ignore
 * 配置项接口
 */
export interface Iconfig {
  sequelize: {
    username?: string;
    password?: any;
    database?: string;
    host: string;
    storage: string;
    dialect: Dialect;
    logging: any;
    timezone?: string;
  };
  logger: {
    appName: string;
    level: string;
    filename?: string;
    timestamp?: boolean;
    uncolorize?: boolean;
  };
  language: string;
  swagger: {
    enable: boolean;
    endPoint: string;
  };
  API_V1: string;
  APP_CONFIG: {
    JWT_SECRET: string;
    JWT_SECRET_EXPIRESIN: string; // token 过期时间
  };
}

/**
 * @ignore
 * 默认配置信息
 */
export const config: Iconfig = {
  sequelize: {
    username: 'root',
    password: null,
    storage: join(__dirname, '../..', './databases/db/database.dev.sqlite'),
    host: 'localhost',
    dialect: 'sqlite' as Dialect,
    logging: console.log,
  },
  language: 'zh-cn',
  logger: {
    appName: 'example',
    level: 'info',
    timestamp: true,
    // filename: 'log/all.log',
  },
  swagger: {
    enable: true,
    endPoint: 'api',
  },
  API_V1: 'v1',
  APP_CONFIG: {
    JWT_SECRET: '12132334234242',
    JWT_SECRET_EXPIRESIN: '10d', // token 过期时间
  },
};
