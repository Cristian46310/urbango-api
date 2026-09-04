import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateDriverDto } from './create-driver.dto';

export class CreateDriverAdminDto extends CreateDriverDto {
  @ApiProperty({
    description: 'ID del usuario existente en ms-security que será conductor',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;
}
