/* istanbul ignore file */
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './user.controller';
import { UserLogingController } from './user-login.controller';
import { User } from './user.entity';
import { UserService } from './user.service';
import { AuthModule } from '../common/auth';

@Module({
  imports: [SequelizeModule.forFeature([User]), AuthModule],
  controllers: [UserController, UserLogingController],
  providers: [UserService],
})
export class UsersModule {}
