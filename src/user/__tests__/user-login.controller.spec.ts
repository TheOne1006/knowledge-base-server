import { Test, TestingModule } from '@nestjs/testing';
import { UserLogingController } from '../user-login.controller';
import { UserService } from '../user.service';
import { AuthService } from '../../common/auth/auth.service';
import { InputLoginDto } from '../dtos';

describe('UserLogingController', () => {
  let controller: UserLogingController;
  let module: TestingModule;
  let mockAuthService: AuthService;
  let mockUserService: UserService;

  beforeEach(async () => {
    mockAuthService = {
      create_token: jest.fn().mockResolvedValue('test'),
    } as any as AuthService;
    mockUserService = {
      check: jest.fn().mockResolvedValue(null),
    } as any as UserService;
    module = await Test.createTestingModule({
      controllers: [UserLogingController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<UserLogingController>(UserLogingController);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should throw error when username or password is not correct', async () => {
      const input: InputLoginDto = { username: 'test', password: 'test' };

      jest.spyOn(mockUserService, 'check').mockResolvedValueOnce(null);

      await expect(controller.login(input)).rejects.toThrow('用户名或密码错误');
    });

    it('should return logined user', async () => {
      const input: InputLoginDto = { username: 'test', password: 'test' };

      jest.spyOn(mockUserService, 'check').mockResolvedValueOnce({
        id: 1000,
        username: 'mock create',
        email: 'xx@qq.com',
      } as any);

      jest.spyOn(mockAuthService, 'create_token').mockResolvedValueOnce('test');

      const expected = {
        id: 1000,
        username: 'mock create',
        email: 'xx@qq.com',
        token: 'test',
      };
      const actual = await controller.login(input);

      expect(actual).toEqual(expected);
    });
  });
});
