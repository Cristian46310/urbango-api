import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GroupMemberRole } from '../enums/group-member-role.enum';

export class ResponseGroupMemberEnrichedDto {
  @ApiProperty()
  @Expose()
  userId!: string;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiProperty()
  @Expose()
  email!: string;

  @ApiProperty({ enum: GroupMemberRole })
  @Expose()
  role!: GroupMemberRole;

  @ApiProperty()
  @Expose()
  joinedAt!: Date;
}
