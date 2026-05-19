import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DashboardScopeDto {
  @ApiPropertyOptional({
    example: 'uuid',
    nullable: true,
    description: 'Empresa filtrada; null = consolidado de todas',
  })
  @Expose()
  enterpriseId!: string | null;

  @ApiPropertyOptional({
    example: 'Transportes UC',
    nullable: true,
  })
  @Expose()
  enterpriseName!: string | null;
}
