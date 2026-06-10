import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseMessageDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  conversationId!: string;

  @Expose()
  @ApiProperty()
  senderId!: string;

  @Expose()
  @ApiProperty()
  body!: string;

  @Expose()
  @ApiPropertyOptional()
  latitude?: number;

  @Expose()
  @ApiPropertyOptional()
  longitude?: number;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'Indica si el destinatario ya leyó el mensaje',
  })
  isRead!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Marca temporal de lectura por el destinatario',
  })
  readAt?: Date;
}
