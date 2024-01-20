import { ApiProperty } from '@nestjs/swagger';
/**
 * PushRunOptionDto
 */
export class PushRunOptionDto {
  @ApiProperty({
    example: ' init',
    description: '推送版本',
  })
  pushVersion: string;
}
