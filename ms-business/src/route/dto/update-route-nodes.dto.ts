import { PartialType } from '@nestjs/swagger';
import { CreateRouteNodesDto } from './create-route-nodes.dto';

export class UpdateRouteNodesDto extends PartialType(CreateRouteNodesDto) {}
