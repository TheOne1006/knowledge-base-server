import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PUSH_TYPE_DIFY } from '../constants';

/**
 * CreatePushConfigDto
 */
export class CreatePushConfigDto {
  @ApiProperty({
    example: 'title',
    description: '推送配置',
  })
  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @Length(2, 50, {
    message: i18nValidationMessage('validation.LENGTH'),
  })
  title: string;

  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @ApiProperty({
    example: 'desc',
    description: '简介',
  })
  desc: string;

  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message: i18nValidationMessage('validation.STRING'),
    },
  )
  @ApiProperty({
    example: 'http://xxxx/v1',
    description: '服务器信息',
  })
  apiUrl: string;

  @ApiProperty({
    example: PUSH_TYPE_DIFY,
    description: '类型',
  })
  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  type: string;

  @ApiProperty({
    example: 'xxxx',
    description: 'key',
  })
  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  apiKey: string;
}
