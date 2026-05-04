import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseCitizenDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'María Gómez' })
  @Expose()
  name?: string;

  @ApiProperty()
  @Expose()
  extraInfo?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}
