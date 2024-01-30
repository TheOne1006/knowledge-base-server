import { pick } from 'lodash';
import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiSecurity,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from '../common/auth/auth.service';
import { SerializerInterceptor } from '../common/interceptors/serializer.interceptor';
import { SerializerClass } from '../common/decorators';
import { LoginedUserDto, InputLoginDto } from './dtos';

import { config } from '../../config';
import { UserService } from './user.service';

const prefix = config.API_V1;

@Controller(`${prefix}/users`)
@ApiSecurity('api_key')
@ApiTags('user')
@UseInterceptors(SerializerInterceptor)
@Controller('user')
export class UserLogingController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 登录
   */
  @Post('/login')
  @ApiOperation({
    summary: '登录',
  })
  @SerializerClass(LoginedUserDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async login(
    @Body() input: InputLoginDto,
    // @User() _user: RequestUser,
  ): Promise<LoginedUserDto> {
    const checkUser = await this.userService.check(
      input.username,
      input.password,
    );

    if (!checkUser) {
      throw new Error('用户名或密码错误');
    }

    const reqUser = pick(checkUser, ['id', 'email', 'username', 'roles']);
    const token = await this.authService.create_token(checkUser);

    const loginedUser = {
      ...reqUser,
      token,
    } as LoginedUserDto;

    return loginedUser;
  }
}
