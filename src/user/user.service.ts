// import * as _ from 'lodash';
import { Transaction, SaveOptions } from 'sequelize';
import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { User } from './user.entity';
import { CreateUserDto, UserDto } from './dtos';

/**
 * 加密密码
 * @param password
 * @param salt
 */
function encryptPassword(password: string, salt: string) {
  const hash = createHash('md5');
  hash.update(password + salt);
  return hash.digest('hex');
}

/**
 * 生成 salt
 * @param length number
 */
function genSalt(length: number = 8): string {
  return Math.random()
    .toString(16)
    .slice(2, length + 2);
}

/**
 * User Service
 *
 */
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  /**
   * 创建用户
   * @param  {CreateUserDto} createUserDto
   * @returns Promise
   */
  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const originPwd = createUserDto.password;
    const salt = genSalt();

    const password = encryptPassword(originPwd, salt);

    const data = new User({
      ...createUserDto,
      salt,
      password,
    });
    const instance = await data.save();

    return instance;
  }

  /**
   * 查找所有用户
   * @returns Promise<UserDto[]>
   */
  async findAll(): Promise<UserDto[]> {
    return this.userModel.findAll();
  }

  /**
   * 根据id,查找用户
   * @param id number
   * @returns Promise<UserDto>
   */
  async findByPk(id: number): Promise<UserDto> {
    return this.userModel.findByPk(id);
  }

  /**
   * 根据id, 删除用户
   * @param id number
   * @returns Promise<UserDto>
   */
  async removeByPk(id: number, transaction?: Transaction): Promise<UserDto> {
    const data = await this.userModel.findByPk(id);

    const options: SaveOptions = {};
    if (transaction) {
      options.transaction = transaction;
    }

    await data.destroy(options);

    return data;
  }

  /**
   * password 更新
   * @param userID 用户名
   * @param inputPassword 密码
   * @param transaction
   */
  async updatePasswordByPk(
    userID: number,
    inputPassword: string,
    transaction?: Transaction,
  ) {
    const instance = await this.userModel.findByPk(userID);

    if (!instance) {
      throw new Error('User not found');
    }

    const salt = genSalt();
    const password = encryptPassword(inputPassword, salt);

    instance.salt = salt;
    instance.password = password;
    instance.updatedAt = new Date();

    const options: SaveOptions = {};
    if (transaction) {
      options.transaction = transaction;
    }

    await instance.save(options);

    return instance;
  }
}
