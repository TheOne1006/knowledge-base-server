import { Dialect } from 'sequelize/types';
import { join } from 'path';

/**
 * 测试环境配置
 */
export const config = {
  sequelize: {
    username: 'root',
    password: null,
    storage: join(__dirname, '..', './databases/db/database.test.sqlite'),
    host: 'localhost',
    dialect: 'sqlite' as Dialect,
    logging: false,
  },
  logger: {
    appName: 'test_app',
    level: 'error',
    timestamp: true,
    // filename: 'log/all.log',
  },
  API_V1: '',
};
