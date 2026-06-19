import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GroupMembershipAction } from '../enums/group-membership-action.enum';

export class ResponseMembershipLogDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty({ enum: GroupMembershipAction })
  @Expose()
  action!: GroupMembershipAction;

  @ApiProperty()
  @Expose()
  actorUserId!: string;

  @ApiPropertyOptional()
  @Expose()
  actorName?: string;

  @ApiPropertyOptional()
  @Expose()
  targetUserId?: string;

  @ApiPropertyOptional()
  @Expose()
  targetName?: string;

  @ApiPropertyOptional()
  @Expose()
  metadata?: Record<string, unknown>;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}
