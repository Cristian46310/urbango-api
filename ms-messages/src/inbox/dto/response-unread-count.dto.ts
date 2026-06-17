import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseUnreadCountDto {
  @Expose()
  @ApiProperty({
    description: 'Cantidad de mensajes recibidos sin leer',
    example: 3,
  })
  count!: number;
}
