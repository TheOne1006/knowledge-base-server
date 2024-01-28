import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  Length,
  Matches,
  IsArray,
  // MinLength,
  // MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * CreateKbSiteDto
 */
export class CreateKbSiteDto {
  @ApiProperty({
    example: 'title',
    description: '站点名称(使用,英文且不含特殊字符)',
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
  @Matches(/^[a-zA-Z0-9_\-]+$/i, {
    message: i18nValidationMessage('validation.MATCHES'),
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
    each: true,
    message: i18nValidationMessage('validation.STRING'),
  })
  @IsArray()
  matchPatterns: string[];

  @ApiProperty({
    example: ['^https:\\/\\/marmelab.com\\/react-admin\\/doc\\/*'],
    description: '剔除规则，由于 matchPatterns',
  })
  @IsString({
    each: true,
    message: i18nValidationMessage('validation.STRING'),
  })
  @IsArray()
  ignorePatterns?: string[] = [];

  @ApiProperty({
    example: '',
    description: '执行脚本 返回 html',
  })
  evaluate?: string;

  @ApiProperty({
    example: ['nav', 'aside', 'footer', 'div.row > div.col.col--3'],
    description: '移除的选择器',
  })
  @IsArray()
  removeSelectors: string[];

  @ApiProperty({
    example: '1',
    description: 'kbId',
  })
  kbId?: number;
}
