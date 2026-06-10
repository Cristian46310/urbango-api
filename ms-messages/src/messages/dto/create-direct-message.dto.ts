import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { BaseMessageDto } from './base-message.dto';

export class CreateDirectMessageDto extends BaseMessageDto {
  @ApiProperty({
    example: '665f1c2e9a1b2c3d4e5f6789',
    description: 'ID del destinatario en ms-security (MongoDB ObjectId)',
  })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;
}
