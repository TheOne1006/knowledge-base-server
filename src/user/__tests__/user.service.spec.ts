import { SequelizeModule } from '@nestjs/sequelize';
// import { Sequelize } from 'sequelize-typescript';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../user.entity';
import { UserService } from '../user.service';
import { ROLE_USER } from '../../common/constants';
import { CoreModule } from '../../core/core.module';

describe('UserService', () => {
  let service: UserService;
  let moduleRef: TestingModule;
  // let sequelize: Sequelize;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CoreModule, SequelizeModule.forFeature([User])],
      providers: [UserService],
    }).compile();

    // sequelize = moduleRef.get(Sequelize);

    service = moduleRef.get<UserService>(UserService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('base test', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('READ', () => {
    describe('findAll()', () => {
      it('should return user list', async () => {
        const users = await service.findAll();
        expect(users.length).toBeGreaterThan(0);
      });
    });
    describe('findByPk()', () => {
      it('should return an user', async () => {
        const user = await service.findByPk(1);
        const expectedUsers = {
          id: 1,
          username: 'John',
          email: '2ddd@xxx.com',
          salt: '1233',
          password: 'xxxxx',
        };
        // 包含
        expect(user).toMatchObject(expectedUsers);
      });
    });
  });

  describe('UPDATE', () => {
    describe('updatePasswordByPk()', () => {
      it('should update password', async () => {
        const user = await service.updatePasswordByPk(1, '123456');

        const expectedUsers = {
          id: 1,
          username: 'John',
          email: '2ddd@xxx.com',
          roles: ['authenticated', 'super-admin'],
        };
        // 包含
        expect(user).toMatchObject(expectedUsers);
      });

      it('should update password', async () => {
        const user = await service.updatePasswordByPk(1, '123456');
        const expectedUsers = {
          id: 1,
          username: 'John',
          email: '2ddd@xxx.com',
          roles: ['authenticated', 'super-admin'],
        };
        // 包含
        expect(user).toMatchObject(expectedUsers);
      });

      it('should update password error', async () => {
        let hasError = false;
        try {
          await service.updatePasswordByPk(9494441, '123456');
        } catch (error) {
          hasError = true;
        }
        // 包含
        expect(hasError).toBeTruthy();
      });
    });
  });

  describe('DELETE', () => {
    describe('remove()', () => {
      it('should remove', async () => {
        const user = await service.removeByPk(3);

        const expectedUsers = {
          id: 3,
          username: 'Tom',
          email: 'ddaass@xxx.com',
          salt: '1233',
          password: 'xxxxx',
        };
        // 包含
        expect(user).toMatchObject(expectedUsers);

        const actual = await service.findByPk(3);
        expect(actual).toBeNull();
      });

      it('should remove', async () => {
        const user = await service.removeByPk(5);

        const expectedUsers = {
          id: 5,
          username: 'delete trans',
          email: 'deltetrans@xxx.com',
          salt: '1233',
        };
        // 包含
        expect(user).toMatchObject(expectedUsers);

        const actual = await service.findByPk(5);
        expect(actual).toBeNull();
      });
    });
  });

  describe('CREATE', () => {
    describe('create()', () => {
      it('should create', async () => {
        const actual = await service.create({
          username: 'lddka',
          email: 'ddaass@xxx.com',
          password: 'xxxxx',
          roles: [ROLE_USER],
        });

        const expected = {
          username: 'lddka',
          email: 'ddaass@xxx.com',
          version: 0,
        };
        expect(actual).toMatchObject(expected);
      });
    });
  });

  describe('check()', () => {
    it('should return null if user does not exist', async () => {
      jest.spyOn((service as any).userModel, 'findOne').mockResolvedValue(null);
      const result = await service.check('nonexistent', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const mockUser = {
        username: 'existing',
        salt: '123',
        password: 'wrongpassword',
        toJSON: () => this,
      };
      jest
        .spyOn((service as any).userModel, 'findOne')
        .mockResolvedValue(mockUser);
      const result = await service.check('existing', 'password');
      expect(result).toBeNull();
    });

    it('should return user if username and password match', async () => {
      const mockUser = {
        id: 1,
        salt: '123',
        password: '482c811da5d5b4bc6d497ffa98491e38',
        username: 'John',
        toJSON: () => ({
          id: 1,
          username: 'John',
        }),
      };
      jest
        .spyOn((service as any).userModel, 'findOne')
        .mockResolvedValue(mockUser);

      const result = await service.check('existing', 'password');
      expect(result).toEqual(mockUser.toJSON());
    });
  });
});
