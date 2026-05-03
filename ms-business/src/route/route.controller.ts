import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { RouteService } from './route.service';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateRouteNodesDto } from './dto/create-route-nodes.dto';
import { ResponseRouteDto } from './dto/response-route.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { ResponseRouteListDto } from './dto/response-route-list.dto';

@ApiTags('Routes')
@Controller('route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una ruta' })
  @ApiCreatedResponse({ type: ResponseRouteDto })
  async create(@Body() createRouteDto: CreateRouteNodesDto) {
    return await this.routeService.create(createRouteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las rutas' })
  @ApiOkResponse({ type: ResponseRouteListDto })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.routeService.findAll(paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una ruta por id' })
  @ApiParam({ name: 'id', description: 'Id de la ruta', format: 'uuid' })
  @ApiOkResponse({ type: ResponseRouteDto })
  async findOne(@Param('id') id: string) {
    return await this.routeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una ruta por id' })
  @ApiParam({ name: 'id', description: 'Id de la ruta', format: 'uuid' })
  @ApiOkResponse({ type: ResponseRouteDto })
  async update(
    @Param('id') id: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return await this.routeService.update(id, updateRouteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una ruta por id' })
  @ApiParam({ name: 'id', description: 'Id de la ruta', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Ruta eliminada' })
  async remove(@Param('id') id: string) {
    return await this.routeService.remove(id);
  }
}
