import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { MassAlertScope } from '../enums/mass-alert-scope.enum';
import { MassAlertStatus } from '../enums/mass-alert-status.enum';

export class ResponseMassAlertRecipientCountDto {
  @Expose()
  @ApiProperty()
  count!: number;

  @Expose()
  @ApiProperty({ enum: MassAlertScope })
  scope!: MassAlertScope;

  @Expose()
  @ApiPropertyOptional()
  routeIds?: string[];

  @Expose()
  @ApiPropertyOptional()
  zoneNames?: string[];
}

export class ResponseMassAlertDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  senderId!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiProperty()
  body!: string;

  @Expose()
  @ApiProperty({ enum: MassAlertScope })
  scope!: MassAlertScope;

  @Expose()
  @ApiPropertyOptional()
  routeIds?: string[];

  @Expose()
  @ApiPropertyOptional()
  zoneNames?: string[];

  @Expose()
  @ApiProperty()
  isUrgent!: boolean;

  @Expose()
  @ApiPropertyOptional()
  scheduledAt?: Date;

  @Expose()
  @ApiProperty({ enum: MassAlertStatus })
  status!: MassAlertStatus;

  @Expose()
  @ApiProperty()
  recipientCount!: number;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiPropertyOptional()
  sentAt?: Date;
}

export class ResponseMassAlertStatsDto {
  @Expose()
  @ApiProperty()
  alertId!: string;

  @Expose()
  @ApiProperty()
  totalRecipients!: number;

  @Expose()
  @ApiProperty()
  deliveredCount!: number;

  @Expose()
  @ApiProperty()
  readCount!: number;

  @Expose()
  @ApiProperty()
  unreadCount!: number;

  @Expose()
  @ApiProperty({ description: 'Porcentaje de lectura (0-100)' })
  readPercentage!: number;
}

export class ResponseMassAlertListDto {
  @Expose()
  @ApiProperty({ type: [ResponseMassAlertDto] })
  items!: ResponseMassAlertDto[];

  @Expose()
  @ApiProperty()
  meta!: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
