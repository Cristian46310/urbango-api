import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CardRechargeStatus } from '../enums/card-recharge-status.enum';

export class ResponseCardRechargeStatusDto {
  @ApiProperty()
  reference!: string;

  @ApiProperty({ enum: CardRechargeStatus })
  status!: CardRechargeStatus;

  @ApiProperty()
  amount!: number;

  @ApiPropertyOptional()
  currentBalance?: number;

  @ApiPropertyOptional()
  completedAt?: Date;
}
