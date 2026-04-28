import { ApiProperty } from '@nestjs/swagger';

export class TotalTimeDto {
  @ApiProperty({ example: 42 })
  minutes!: number;

  @ApiProperty({ example: '0h42m' })
  formatted!: string;
}
