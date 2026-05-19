import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateBusDto } from './create-bus.dto';

export class UpdateBusDto extends PartialType(
  OmitType(CreateBusDto, ['plate'] as const),
) {
  @ApiPropertyOptional({
    description: 'URL de la foto del bus',
    example: 'https://supabase.com/...',
  })
  @IsString()
  @IsOptional()
  photoUrl?: string;
}
