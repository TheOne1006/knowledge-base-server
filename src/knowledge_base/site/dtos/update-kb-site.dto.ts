import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  // MinLength,
  // MaxLength,
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
    example: ['^https:\\/\\/marmelab.com\\/*'],
    description: '正则表示,',
  })
  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @IsArray()
  matchPatterns: string[];

  @ApiProperty({
    example: ['^https:\\/\\/marmelab.com\\/react-admin\\/doc\\/*'],
    description: '剔除规则，由于 matchPatterns',
  })
  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @IsArray()
  ignorePatterns: string[];

  @ApiProperty({
    example: ['nav', 'sidebar', 'footer', 'div.header'],
    description: '移除的选择器',
  })
  @IsArray()
  removeSelectors: string[];
}
