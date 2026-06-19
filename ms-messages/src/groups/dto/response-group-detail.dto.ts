import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GroupVisibility } from '../enums/group-visibility.enum';
import { GroupMemberRole } from '../enums/group-member-role.enum';

export class ResponseGroupDetailDto {
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

  @ApiProperty()
  @Expose()
  memberCount!: number;

  @ApiProperty()
  @Expose()
  isMember!: boolean;

  @ApiPropertyOptional({ enum: GroupMemberRole })
  @Expose()
  myRole?: GroupMemberRole;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}
