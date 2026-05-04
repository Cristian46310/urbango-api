import { ApiProperty } from '@nestjs/swagger';

export class ResponseNodeDto {
  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({
    example: '8c5979c5-2681-48a4-bd6f-c6d2f5f57167',
  })
  stopId!: string;

  @ApiProperty({
    example: '8c5979c5-2681-48a4-bd6f-c6d2f5f57167',
  })
  routeId!: string;
}
