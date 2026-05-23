import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { BaseBusDto } from './base-bus.dto';
import { BusStatus } from '../enums/bus-status.enum';

export class CreateBusDto extends OmitType(BaseBusDto, ['enterpriseId'] as const) {
  @ApiProperty({ description: 'Modelo del bus', example: 'Mercedes-Benz O500' })
  @IsString()
  @IsNotEmpty()
  declare model: string;

  @ApiProperty({ description: 'Año del bus', example: 2023 })
  @IsInt()
  @Min(1900)
  declare year: number;

  @ApiProperty({
    description: 'Capacidad de pasajeros sentados',
    example: 35,
  })
  @IsInt()
  @Min(0)
  declare seatedCapacity: number;

  @ApiProperty({
    description: 'Capacidad de pasajeros parados',
    example: 5,
  })
  @IsInt()
  @Min(0)
  declare standingCapacity: number;

  @ApiProperty({
    description: 'Estado inicial del bus',
    enum: BusStatus,
    example: BusStatus.OPERATIVO,
  })
  @IsEnum(BusStatus)
  declare status: BusStatus;
}
