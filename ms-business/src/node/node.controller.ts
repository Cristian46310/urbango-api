import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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

@ApiTags('Nodes')
@Controller('node')
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  @Post('route/:routeId/stop/:stopId')
  @ApiOperation({ summary: 'Crear un nodo para una ruta y parada' })
  @ApiParam({ name: 'routeId', description: 'Id de la ruta', format: 'uuid' })
  @ApiParam({ name: 'stopId', description: 'Id de la parada', format: 'uuid' })
  @ApiCreatedResponse({ type: Node })
  async create(
    @Param('routeId') routeId: string,
    @Param('stopId') stopId: string,
    @Body() createNodeDto: CreateNodeDto,
  ) {
    return await this.nodeService.create(routeId, stopId, createNodeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los nodos' })
  @ApiOkResponse({ type: Node, isArray: true })
  async findAll() {
    return await this.nodeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un nodo por id' })
  @ApiParam({ name: 'id', description: 'Id del nodo', format: 'uuid' })
  @ApiOkResponse({ type: Node })
  async findOne(@Param('id') id: string) {
    return await this.nodeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un nodo por id' })
  @ApiParam({ name: 'id', description: 'Id del nodo', format: 'uuid' })
  @ApiOkResponse({ type: Node })
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
