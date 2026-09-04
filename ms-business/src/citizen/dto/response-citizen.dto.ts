import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ResponseAddressDto } from '@/address/dto/response-address.dto';

export class ResponseCitizenDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'María Gómez' })
  @Expose()
  name?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @Expose()
  document?: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @Expose()
  email?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({
    example:
      'https://xxx.supabase.co/storage/v1/object/public/user-photo/users/...',
  })
  @Expose()
  photoUrl?: string;

  @ApiProperty({ required: false })
  @Expose()
  birthDate?: Date;

  @ApiPropertyOptional({ example: 'uuid-de-la-direccion' })
  @Expose()
  addressId?: string;

  @ApiPropertyOptional({ type: () => ResponseAddressDto })
  @Expose()
  @Type(() => ResponseAddressDto)
  address?: ResponseAddressDto;

  @ApiPropertyOptional()
  @Expose()
  userId?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}
