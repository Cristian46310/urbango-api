import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ConversationType } from '../enums/conversation-type.enum';

export class ResponseConversationDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty({ enum: ConversationType })
  type!: ConversationType;

  @Expose()
  @ApiProperty({ type: [String] })
  memberIds!: string[];

  @Expose()
  @ApiProperty()
  createdAt!: Date;
}
