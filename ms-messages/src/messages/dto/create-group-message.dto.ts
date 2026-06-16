import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { BaseMessageDto } from './base-message.dto';

export class CreateGroupMessageDto extends BaseMessageDto {
  @ApiProperty({
    description: 'IDs de uno o más grupos destinatarios',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  groupIds!: string[];
}
