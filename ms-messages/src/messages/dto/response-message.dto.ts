import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { MessageType } from '../enums/message-type.enum';

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
  @ApiProperty({ enum: MessageType })
  messageType!: MessageType;

  @Expose()
  @ApiPropertyOptional({
    description: 'Presente cuando messageType es group',
  })
  groupId?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Presente cuando messageType es group',
  })
  groupName?: string;

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

  @Expose()
  @ApiPropertyOptional({
    description:
      'Cantidad de miembros que leyeron (solo mensajes grupales, vista remitente)',
  })
  readCount?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Total de miembros del grupo excluyendo remitente',
  })
  totalRecipients?: number;
}
