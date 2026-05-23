import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class BaseNodeDto {
  @ApiProperty({ example: 1, minimum: 0 })
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty({
    example: '8c5979c5-2681-48a4-bd6f-c6d2f5f57167',
    description: 'ID del stop asociado al nodo',
  })
  @IsUUID()
  @IsNotEmpty()
  stopId!: string;

  @ApiProperty({ example: 5, minimum: 0 })
  @IsInt()
  @Min(0)
  estimatedTimeMinutes!: number;
}
