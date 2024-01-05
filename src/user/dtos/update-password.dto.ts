import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'password',
    description: '新密码',
  })
  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @Length(5, 20, {
    message: i18nValidationMessage('validation.LENGTH'),
  })
  password: string;
}
