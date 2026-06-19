import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

export class GroupSearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Buscar por nombre o descripción',
    example: 'transporte',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
