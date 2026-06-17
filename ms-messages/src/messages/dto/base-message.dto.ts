import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class BaseMessageDto {
  @ApiProperty({ example: 'Hola, ¿a qué hora sale el bus?', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  body!: string;

  @ApiPropertyOptional({ example: 5.06889 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: -75.51738 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
