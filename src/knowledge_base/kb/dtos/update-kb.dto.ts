import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * UpdateKbDto
 */
export class UpdateKbDto {
  @IsString({
    message: i18nValidationMessage('validation.STRING'),
  })
  @ApiProperty({
    example: 'desc',
    description: '描述',
  })
  desc: string;
}
