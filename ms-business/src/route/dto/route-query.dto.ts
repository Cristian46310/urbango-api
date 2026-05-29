import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

export class RouteQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'Norte',
    description:
      'Filtra rutas cuyo nombre contiene este texto (insensible a mayúsculas)',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
