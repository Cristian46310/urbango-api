import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { NodeService } from './node.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { Node } from './entities/node.entity';
import { ResponseNodeDto } from './dto/response-node.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseNodeListDto } from './dto/response-node-list.dto';

@ApiTags('Nodes')
@Controller('node')
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  @Post('route/:routeId/stop/:stopId')
  @ApiOperation({ summary: 'Crear un nodo para una ruta y parada' })
  @ApiParam({ name: 'routeId', description: 'Id de la ruta', format: 'uuid' })
  @ApiParam({ name: 'stopId', description: 'Id de la parada', format: 'uuid' })
  @ApiCreatedResponse({ type: ResponseNodeDto })
  async create(
    @Param('routeId') routeId: string,
    @Param('stopId') stopId: string,
    @Body() createNodeDto: CreateNodeDto,
  ) {
    return await this.nodeService.create(routeId, stopId, createNodeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los nodos' })
  @ApiOkResponse({ type: ResponseNodeListDto })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.nodeService.findAll(paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un nodo por id' })
  @ApiParam({ name: 'id', description: 'Id del nodo', format: 'uuid' })
  @ApiOkResponse({ type: ResponseNodeDto })
  async findOne(@Param('id') id: string) {
    return await this.nodeService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un nodo por id' })
  @ApiParam({ name: 'id', description: 'Id del nodo', format: 'uuid' })
  @ApiOkResponse({ type: ResponseNodeDto })
  async update(@Param('id') id: string, @Body() updateNodeDto: UpdateNodeDto) {
    return await this.nodeService.update(id, updateNodeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un nodo por id' })
  @ApiParam({ name: 'id', description: 'Id del nodo', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Nodo eliminado' })
  async remove(@Param('id') id: string) {
    return await this.nodeService.remove(id);
  }
}
