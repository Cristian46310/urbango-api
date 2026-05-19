import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { BaseBusDto } from './base-bus.dto';
import { BusStatus } from '../enums/bus-status.enum';

export class CreateBusDto extends OmitType(BaseBusDto, [
  'enterpriseId',
  'qrCode',
  'photoUrl',
] as const) {
  @ApiProperty({ description: 'Modelo del bus', example: 'Mercedes-Benz O500' })
  @IsString()
  @IsNotEmpty()
  declare model: string;

  @ApiProperty({ description: 'Año del bus', example: 2023 })
  @IsInt()
  @Min(1900)
  declare year: number;

  @ApiProperty({
    description: 'Capacidad máxima de pasajeros',
    example: 40,
  })
  @IsInt()
  @Min(1)
  declare capacity: number;

  @ApiProperty({
    description: 'Estado inicial del bus',
    enum: BusStatus,
    example: BusStatus.OPERATIVO,
  })
  @IsEnum(BusStatus)
  declare status: BusStatus;
}
