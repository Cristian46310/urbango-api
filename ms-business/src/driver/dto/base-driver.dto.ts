import { BasePersonDto } from '@/shared/dto/base-person.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class BaseDriverDto extends BasePersonDto {
  @ApiProperty({ example: '123456789', required: false })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;
}
