import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIncidentDto {
  @ApiProperty({ enum: ['mechanical', 'accident', 'delay', 'other'] })
  @IsIn(['mechanical', 'accident', 'delay', 'other'])
  type!: 'mechanical' | 'accident' | 'delay' | 'other';

  @ApiProperty({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity!: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ description: 'Driver id' })
  @IsUUID()
  driverId!: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Buses involved in the incident',
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  @IsOptional()
  busIds?: string[];
}