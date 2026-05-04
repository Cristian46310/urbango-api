import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class BaseDriverDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'ABC123456' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;
}
