import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
// import { SequelizeModule } from '@nestjs/sequelize';

import { User } from '../src/user/user.entity';
import users_db from './init_dbs/users.db';

import { AppModule } from '../src/app.module';

const mockModels = [
  {
    entity: User,
    bulkData: users_db,
  },
];

export async function loadMockData(moduleFixture: TestingModule) {
  // const sequelize = moduleFixture.get(Sequelize);

  for (let index = 0; index < mockModels.length; index++) {
    const current = mockModels[index];
    const CurModel = moduleFixture.get(getModelToken(current.entity));
    await CurModel.truncate();
    // await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      if (current?.bulkData?.length) {
        await CurModel.bulkCreate(current.bulkData);
      }
    } catch (error) {
      console.log(error);
      console.error('init error at', getModelToken(current.entity));
    }
  }
}

/**
 * fix: Encoding not recognized: 'cesu8'
 */
// iconv.encodingExists('foo');

module.exports = async function startApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();

  await app.init();
  await loadMockData(moduleFixture);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // await redisFlush(moduleFixture);
  return app.close();
};
