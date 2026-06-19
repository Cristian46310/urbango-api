import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { GroupMemberRole } from '../enums/group-member-role.enum';

export class UpdateGroupMemberRoleDto {
  @ApiProperty({ enum: GroupMemberRole, example: GroupMemberRole.ADMIN })
  @IsEnum(GroupMemberRole)
  role!: GroupMemberRole;
}
