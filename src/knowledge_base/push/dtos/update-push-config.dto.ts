import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, Length, IsObject } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * UpdatePushConfigDto
 */
export class UpdatePushConfigDto {
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
    example: 'http://theone-ubuntu.local/v1',
    description: '服务器信息',
  })
  apiUrl: string;

  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  apiKey: string;

  @ApiProperty({
    example: { extend_config: { foo: 1 } },
    description: '接口额外的配置项',
  })
  @IsObject()
  additional: Record<string, any> = {};
}
