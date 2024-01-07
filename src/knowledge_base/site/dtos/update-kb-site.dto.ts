import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  MinLength,
  MaxLength,
  IsArray,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * UpdateKbSiteDto
 */
export class UpdateKbSiteDto {
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
    example: 'https://nestjs.bootcss.com/',
    description: '域名信息',
  })
  hostname: string;

  @ApiProperty({
    example: ['/modules.html', '/middlewares.html'],
    description: '起始路径',
  })
  @IsArray()
  startUrls: string[];

  @ApiProperty({
    example: '^https://nestjs.bootcss.com/**/*',
    description: '正则表示',
  })
  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @MinLength(5, {
    message: i18nValidationMessage('validation.MIN_LENGTH'),
  })
  @MaxLength(100, {
    message: i18nValidationMessage('validation.MAX_LENGTH'),
  })
  pattern: string;

  @ApiProperty({
    example: ['nav', 'sidebar', 'footer', 'div.header'],
    description: '移除的选择器',
  })
  @IsArray()
  removeSelectors: string[];
}
