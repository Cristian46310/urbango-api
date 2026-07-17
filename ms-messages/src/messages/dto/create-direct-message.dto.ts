import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { BaseMessageDto } from './base-message.dto';

export class CreateDirectMessageDto extends BaseMessageDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del destinatario en ms-security (UUID)',
  })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;
}
