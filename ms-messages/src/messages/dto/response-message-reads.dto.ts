import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MessageReadReceiptDto {
  @Expose()
  @ApiProperty()
  userId!: string;

  @Expose()
  @ApiProperty()
  readAt!: Date;
}

export class ResponseMessageReadsDto {
  @Expose()
  @ApiProperty()
  messageId!: string;

  @Expose()
  @ApiProperty()
  conversationId!: string;

  @Expose()
  @ApiProperty()
  groupId!: string;

  @Expose()
  @ApiProperty()
  groupName!: string;

  @Expose()
  @ApiProperty({ type: [MessageReadReceiptDto] })
  readBy!: MessageReadReceiptDto[];

  @Expose()
  @ApiProperty()
  totalMembers!: number;

  @Expose()
  @ApiProperty()
  readCount!: number;
}
