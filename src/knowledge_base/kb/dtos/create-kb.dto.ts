import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * CreateKbDto
 */
export class CreateKbDto {
  @ApiProperty({
    example: 'title',
    description: '资源库名称(英文不含特殊字符)',
  })
  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @Length(2, 20, {
    message: i18nValidationMessage('validation.LENGTH'),
  })
  @Matches(/^[a-zA-Z0-9_]+$/i, {
    message: i18nValidationMessage('validation.MATCHES'),
  })
  title: string;

  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @ApiProperty({
    example: 'desc',
    description: '描述',
  })
  desc: string;
}
