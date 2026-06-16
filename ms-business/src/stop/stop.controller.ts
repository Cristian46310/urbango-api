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
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { StopService } from './stop.service';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { ResponseStopDto } from './dto/response-stop.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseStopListDto } from './dto/response-stop-list.dto';
import { NearbyStopDto } from './dto/nearby-stop.dto';
import { NearbyStopQueryDto } from '@/stop/dto/nearby-stop-query.dto';

@ApiTags('Stops')
@Controller('stop')
export class StopController {
  constructor(private readonly stopService: StopService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una parada' })
  @ApiBody({ type: CreateStopDto })
  @ApiCreatedResponse({ type: ResponseStopDto })
  async create(@Body() createStopDto: CreateStopDto): Promise<ResponseStopDto> {
    return await this.stopService.create(createStopDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las paradas' })
  @ApiOkResponse({ type: ResponseStopListDto })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<ResponseStopListDto> {
    return await this.stopService.findAll(paginationQuery);
  }
  //Buscar paradas cercanas a una ubicación dada

  @Get('nearby')
  @ApiOperation({ summary: 'Buscar paradas cercanas a una ubicación dada' })
  @ApiOkResponse({ type: [NearbyStopDto] })
  async findNearbyStops(
    @Query() nearbyQuery: NearbyStopQueryDto,
  ): Promise<NearbyStopDto[]> {
    return await this.stopService.findNearbyStops(
      nearbyQuery.lat,
      nearbyQuery.lon,
      nearbyQuery.limit,
      nearbyQuery.radiusMeters,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una parada por id' })
  @ApiParam({ name: 'id', description: 'Id de la parada', format: 'uuid' })
  @ApiOkResponse({ type: ResponseStopDto })
  async findOne(@Param('id') id: string): Promise<ResponseStopDto> {
    return await this.stopService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una parada por id' })
  @ApiParam({ name: 'id', description: 'Id de la parada', format: 'uuid' })
  @ApiOkResponse({ type: ResponseStopDto })
  async update(
    @Param('id') id: string,
    @Body() updateStopDto: UpdateStopDto,
  ): Promise<ResponseStopDto> {
    return await this.stopService.update(id, updateStopDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una parada por id' })
  @ApiParam({ name: 'id', description: 'Id de la parada', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Parada eliminada' })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.stopService.remove(id);
  }
}
