import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GroupVisibility } from '../enums/group-visibility.enum';
import { GroupMemberRole } from '../enums/group-member-role.enum';

export class ResponseGroupMemberDto {
  @ApiProperty()
  @Expose()
  userId!: string;

  @ApiProperty({ enum: GroupMemberRole })
  @Expose()
  role!: GroupMemberRole;

  @ApiProperty()
  @Expose()
  joinedAt!: Date;
}

export class ResponseGroupDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiProperty({ enum: GroupVisibility })
  @Expose()
  visibility!: GroupVisibility;

  @ApiPropertyOptional()
  @Expose()
  iconUrl?: string;

  @ApiProperty()
  @Expose()
  createdBy!: string;

  @ApiProperty()
  @Expose()
  conversationId!: string;

  @ApiProperty({ type: [ResponseGroupMemberDto] })
  @Expose()
  members!: ResponseGroupMemberDto[];

  @ApiPropertyOptional()
  @Expose()
  memberCount?: number;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}
