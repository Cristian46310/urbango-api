import { PartialType } from '@nestjs/mapped-types';
import { CreateRouteNodesDto } from './create-route-nodes.dto';

export class UpdateRouteNodesDto extends PartialType(CreateRouteNodesDto) {}
