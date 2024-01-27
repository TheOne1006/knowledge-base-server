import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';

describe('UserController', () => {
  let controller: UserController;
  let module: TestingModule;
  beforeAll(async () => {
    const UserServiceMock = {
      create: jest.fn().mockImplementation(() => ({
        id: 1000,
        username: 'mock create',
        email: 'xxx@xx.com',
        roles: [],
      })),
      current: jest.fn().mockImplementation(() => ({
        id: 1000,
        username: 'mock current',
        email: 'xxx@xx.com',
        roles: [],
      })),
      updatePasswordByPk: jest.fn().mockImplementation(() => ({
        id: 1000,
        username: 'mock updatePassword',
        email: 'xxx@xx.com',
        roles: [],
      })),
      findAll: jest.fn().mockImplementation(() => [
        {
          id: 1000,
          username: 'mock create',
        },
        {
          id: 1001,
          username: 'mock create',
        },
      ]),
      findByPk: jest.fn().mockImplementation(() => ({
        id: 1,
        username: 'mock find',
      })),
    };

    module = await Test.createTestingModule({
      providers: [
        {
          provide: UserService,
          useValue: UserServiceMock,
        },
      ],
      controllers: [UserController],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('READ', () => {
    it('users list', async () => {
      const mockRes = {
        set: jest.fn(),
      } as any;

      const actual = await controller.list(mockRes);
      expect(actual.length).toBeGreaterThan(1);
    });

    it('user current', async () => {
      const reqUser = {
        id: 1000,
        username: 'mock current',
        email: 'xxx@xx.com',
        roles: [],
      };
      const actual = await controller.getUserCurrent(reqUser);
      expect(actual).toEqual(reqUser);
    });

    it('users findByPk', async () => {
      const actual = await controller.findByPk(1);
      const expected = {
        id: 1,
        username: 'mock find',
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('UPDATE', () => {
    it('user changePassword', async () => {
      const reqUser = {
        id: 1000,
        username: 'mock create',
        email: 'xxx@xx.com',
        roles: [],
      };

      const actual = await controller.updatePassword(
        {
          password: '123',
        },
        reqUser,
      );

      const expected = {
        id: 1000,
        username: 'mock updatePassword',
        email: 'xxx@xx.com',
        roles: [],
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('CREATE', () => {
    it('user create', async () => {
      const newUser = {
        id: 1000,
        username: 'mock create',
        email: 'xxx@xx.com',
        password: '123',
        roles: [],
      };

      const actual = await controller.create(newUser);

      const expected = {
        id: 1000,
        username: 'mock create',
        email: 'xxx@xx.com',
        roles: [],
      };

      expect(actual).toEqual(expected);
    });
  });
});
