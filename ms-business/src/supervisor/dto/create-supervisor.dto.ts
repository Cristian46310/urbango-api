import { BaseSupervisorDto } from './base-supervisor.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSupervisorDto extends BaseSupervisorDto {
  @ApiProperty({
    description: 'ID de la empresa a la que pertenece el supervisor',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  enterpriseId!: string;
}
