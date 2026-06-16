import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDirectConversationDto {
  @ApiProperty({
    example: '665f1c2e9a1b2c3d4e5f6789',
    description: 'ID del destinatario en ms-security',
  })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;
}
