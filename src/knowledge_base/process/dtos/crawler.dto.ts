import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  // IsNotEmpty,
  // IsUrl,
  // Length,
  // Matches,
  // IsArray,
  // MinLength,
  // MaxLength,
  IsEnum,
  IsNumber,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  CRAWLER_TYPES,
  CRAWLER_TYPE_ALL,
  CRAWLER_TYPE_INCREMENTAL,
} from '../constants';

/**
 * CrawlerDto
 */
export class CrawlerDto {
  @ApiProperty({
    example: '1',
    description: '最大爬取链接数',
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    {
      message: i18nValidationMessage('validation.NUMBER'),
    },
  )
  @Max(1000, {
    message: i18nValidationMessage('validation.MAX'),
  })
  @Min(1, {
    message: i18nValidationMessage('validation.MIN'),
  })
  maxConnections: number;

  @ApiProperty({
    example: '1',
    description: '并发数',
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    {
      message: i18nValidationMessage('validation.NUMBER'),
    },
  )
  @Max(5, {
    message: i18nValidationMessage('validation.MAX'),
  })
  @Min(1, {
    message: i18nValidationMessage('validation.MIN'),
  })
  concurrency: number;

  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @ApiProperty({
    example: 'a[href]',
    description: '连接选择',
  })
  linkSelector: string;

  @ApiProperty({
    example: [CRAWLER_TYPE_INCREMENTAL],
    description: '爬取方式（全量、增量)',
  })
  @IsEnum([CRAWLER_TYPE_ALL, CRAWLER_TYPE_INCREMENTAL], {
    each: true,
    message: i18nValidationMessage('validation.ENUM'),
  })
  type: CRAWLER_TYPES;
}
