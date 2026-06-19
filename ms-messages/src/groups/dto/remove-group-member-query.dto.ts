import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class RemoveGroupMemberQueryDto {
  @ApiPropertyOptional({ description: 'Bloquear reingreso al grupo' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  block?: boolean;

  @ApiPropertyOptional({ description: 'Motivo de la remoción o bloqueo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
