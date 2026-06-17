import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MassAlertScope } from '../enums/mass-alert-scope.enum';

export class BaseMassAlertDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body!: string;

  @ApiProperty({ enum: MassAlertScope })
  @IsEnum(MassAlertScope)
  scope!: MassAlertScope;

  @ApiPropertyOptional({
    type: [String],
    description: 'Obligatorio cuando scope es route',
  })
  @ValidateIf((dto: BaseMassAlertDto) => dto.scope === MassAlertScope.ROUTE)
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  routeIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Obligatorio cuando scope es zone (nombre de ciudad/zona)',
  })
  @ValidateIf((dto: BaseMassAlertDto) => dto.scope === MassAlertScope.ZONE)
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  zoneNames?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({
    description:
      'Fecha/hora ISO 8601 para envío programado. Si se omite, se envía de inmediato.',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
