import { ApiProperty } from '@nestjs/swagger';

export class CitizenSummaryDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'María Gómez' })
  name!: string;

  @ApiProperty({ example: 'ABC123456', required: false })
  document?: string;
}
