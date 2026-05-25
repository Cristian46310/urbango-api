import { ApiProperty } from '@nestjs/swagger';

export class ResponseNodeDto {
  @ApiProperty({
    example: '64b345ef-b653-47d7-96c7-c22f1ff58b17',
    description: 'ID del nodo (usar en POST /boarding como nodeId)',
  })
  id!: string;

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

  @ApiProperty({ example: 5 })
  estimatedTimeMinutes!: number;
}
