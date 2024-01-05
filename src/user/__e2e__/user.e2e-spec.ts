import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { ROLE_SUPER_ADMIN, ROLE_USER } from '../../common/constants';
// import { initApp } from '../../../test/helper';

describe('User (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User::CREATE', () => {
    const endPoint = '/users/create';
    it(`POST ${endPoint} success`, async () => {
      const input = {
        username: 'test001',
        email: 'test@example.com',
        password: '123456',
        roles: [ROLE_USER],
      };

      const res = await request(app.getHttpServer())
        .post(endPoint)
        .set('Content-Type', 'application/json')
        .set('accept', 'application/json')
        .set('token', '_mock1,super-admin')
        .send(input)
        .expect(201);

      const actual = res.body;

      const expected = {
        username: 'test001',
        email: 'test@example.com',
        roles: [ROLE_USER],
      };
      expect(actual).toMatchObject(expected);
    });
  });

  describe('User::QUERY', () => {
    const endPoint = '/users';
    it(`GET ${endPoint} success`, async () => {
      const res = await request(app.getHttpServer())
        .get(endPoint)
        .set('Content-Type', 'application/json')
        .set('accept', 'application/json')
        .set('token', '_mock1,super-admin')
        .expect(200);

      const actual = res.body;

      expect(actual).toBeGreaterThan(2);
    });

    it(`GET ${endPoint}/me success`, async () => {
      const res = await request(app.getHttpServer())
        .get(`${endPoint}/current`)
        .set('Content-Type', 'application/json')
        .set('accept', 'application/json')
        .set('token', '_mock1,super-admin')
        .expect(200);

      const actual = res.body;

      const expected = {
        username: '_mock1',
        email: '',
        roles: [ROLE_SUPER_ADMIN],
      };
      expect(actual).toMatchObject(expected);
    });
  });
});
