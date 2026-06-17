import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { BaseMassAlertDto } from './base-mass-alert.dto';

export class PreviewMassAlertRecipientsDto extends BaseMassAlertDto {}

export class CreateMassAlertDto extends BaseMassAlertDto {
  @ApiPropertyOptional({
    description:
      'Si es true, solo calcula destinatarios sin crear la alerta (equivalente a POST /mass-alerts/preview-recipients)',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  previewOnly?: boolean;
}
