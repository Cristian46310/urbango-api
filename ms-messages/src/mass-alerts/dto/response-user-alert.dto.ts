import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { MassAlertScope } from '../enums/mass-alert-scope.enum';

export class ResponseUserAlertDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  title!: string;

  @Expose()
  @ApiProperty()
  body!: string;

  @Expose()
  @ApiProperty()
  isUrgent!: boolean;

  @Expose()
  @ApiProperty({ enum: MassAlertScope })
  scope!: MassAlertScope;

  @Expose()
  @ApiProperty()
  senderId!: string;

  @Expose()
  @ApiPropertyOptional()
  senderName?: string;

  @Expose()
  @ApiProperty()
  sentAt!: Date;

  @Expose()
  @ApiProperty()
  isRead!: boolean;

  @Expose()
  @ApiPropertyOptional()
  readAt?: Date;

  @Expose()
  @ApiProperty({
    description:
      'Las alertas masivas son unidireccionales; el usuario no puede responder.',
    default: false,
  })
  canReply!: boolean;
}

export class ResponseUserAlertListDto {
  @Expose()
  @ApiProperty({ type: [ResponseUserAlertDto] })
  items!: ResponseUserAlertDto[];

  @Expose()
  @ApiProperty()
  meta!: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export class ResponseUserAlertUnreadCountDto {
  @Expose()
  @ApiProperty()
  count!: number;
}
