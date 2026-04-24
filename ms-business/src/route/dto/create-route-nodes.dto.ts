import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseNodeDto } from 'src/node/dto/base-node.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateRouteDto } from './create-route.dto';

export class CreateRouteNodesDto extends CreateRouteDto {
  @ApiPropertyOptional({
    description: 'Nodos asociados a la ruta',
    type: [BaseNodeDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseNodeDto)
  nodes?: BaseNodeDto[];
}
