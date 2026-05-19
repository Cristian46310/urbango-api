import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { IncidentStatus } from '../enums/incident.enum';

export class UpdateIncidentStatusDto {
  @ApiProperty({
    enum: IncidentStatus,
    example: IncidentStatus.IN_REVIEW,
    description:
      'reported = pendiente, in_review = en revisión, closed = resuelto',
  })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;
}
