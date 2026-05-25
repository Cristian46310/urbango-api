import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from '../enums/incident.enum';
import { ResponseIncidentDriverDto } from './response-incident-driver.dto';
import { ResponseIncidentPhotoDto } from '@/incident-photo/dto/response-incident-photo.dto';

export class ResponseIncidentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '2026-05-18T12:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ enum: IncidentType, example: IncidentType.MECHANICAL })
  @Expose()
  type!: IncidentType;

  @ApiProperty({ enum: IncidentSeverity, example: IncidentSeverity.HIGH })
  @Expose()
  severity!: IncidentSeverity;

  @ApiProperty({ enum: IncidentStatus, example: IncidentStatus.REPORTED })
  @Expose()
  status!: IncidentStatus;

  @ApiProperty({ example: 'Falla en el motor delantero' })
  @Expose()
  description!: string;

  @ApiProperty({ type: ResponseIncidentDriverDto, required: false })
  @Expose()
  @Type(() => ResponseIncidentDriverDto)
  driver?: ResponseIncidentDriverDto;

  @ApiProperty({ type: [ResponseIncidentPhotoDto] })
  @Expose()
  @Type(() => ResponseIncidentPhotoDto)
  photos!: ResponseIncidentPhotoDto[];
}
