import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiSecurity,
  ApiResponse,
} from '@nestjs/swagger';

import { SerializerInterceptor } from '../common/interceptors/serializer.interceptor';
import { Roles, SerializerClass, User } from '../common/decorators';
import { RolesGuard } from '../common/auth';
import { ROLE_AUTHENTICATED, ROLE_SUPER_ADMIN } from '../common/constants';
import { RequestUser } from '../common/interfaces';
import { UserDto, CreateUserDto, UpdatePasswordDto } from './dtos';

import { config } from '../../config';
import { UserService } from './user.service';

const prefix = config.API_V1;

@UseGuards(RolesGuard)
@Roles(ROLE_AUTHENTICATED)
@Controller(`${prefix}/users`)
@ApiSecurity('api_key')
@ApiTags('user')
@UseInterceptors(SerializerInterceptor)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  /**
   * 获取所有用户信息
   *
   */
  @Get('/')
  @ApiOperation({
    summary: '用户信息',
  })
  @Roles(ROLE_SUPER_ADMIN)
  @SerializerClass(UserDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async list(): Promise<UserDto[]> {
    const users = await this.userService.findAll();

    return users;
  }

  /**
   * 获取用户自身数据
   *
   * @param user
   */
  @Get('/current')
  @ApiOperation({
    summary: '获取当前用户',
  })
  @SerializerClass(UserDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getUserCurrent(@User() user: RequestUser): Promise<RequestUser> {
    return user;
  }

  /**
   * 创建新用户
   *
   * @param user
   */
  @Post('/create')
  @Roles(ROLE_SUPER_ADMIN)
  @ApiOperation({
    summary: '创建新用户',
  })
  @SerializerClass(UserDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @Body() newUserDto: CreateUserDto,
    // @User() _user: RequestUser,
  ): Promise<UserDto> {
    const newUser = await this.userService.create(newUserDto);

    return newUser;
  }

  /**
   * 修改密码
   *
   * @param user
   */
  @Post('/changePassword')
  @ApiOperation({
    summary: '更新密码',
  })
  @SerializerClass(UserDto)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updatePassword(
    @Body(new ValidationPipe()) newPassword: UpdatePasswordDto,
    @User() selfUser: RequestUser,
  ): Promise<UserDto> {
    const newUser = await this.userService.updatePasswordByPk(
      selfUser.id,
      newPassword.password,
    );

    return newUser;
  }
}
