import { Type } from 'class-transformer';
import { BaseNodeDto } from 'src/node/dto/base-node.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateRouteDto } from './create-route.dto';

export class CreateRouteNodesDto extends CreateRouteDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseNodeDto)
  nodes?: BaseNodeDto[];
}
