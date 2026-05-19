import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartTurnRequestDto {
  @ApiProperty({ example: 'operativo' })
  @IsString()
  @IsNotEmpty()
  busStatus: string;

  @ApiProperty({
    example: 'Llantas un poco desgastadas',
    required: false,
  })
  @IsString()
  @IsOptional()
  observations?: string;
}
