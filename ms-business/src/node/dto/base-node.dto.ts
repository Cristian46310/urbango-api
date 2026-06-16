import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

function toInt(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : undefined;
}

export class BaseNodeDto {
  @ApiProperty({ example: 1, minimum: 0 })
  @Transform(({ value }) => toInt(value))
  @Type(() => Number)
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

  @ApiProperty({
    example: 5,
    minimum: 0,
    description:
      'Minutos desde el inicio hasta este paradero. El nodo con order=1 debe ser 0.',
  })
  @Transform(({ value }) => toInt(value))
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedTimeMinutes!: number;
}
