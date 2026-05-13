import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseFloatPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { StopService } from './stop.service';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { ResponseStopDto } from './dto/response-stop.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseStopListDto } from './dto/response-stop-list.dto';
import { NearbyStopDto } from './dto/nearby-stop.dto';

@ApiTags('Stops')
@Controller('stop')
export class StopController {
  constructor(private readonly stopService: StopService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una parada' })
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
  @ApiQuery({ name: 'lat', type: Number, required: true, example: 12.3456, description: 'Latitud de la ubicación' })
  @ApiQuery({ name: 'lon', type: Number, required: true, example: 78.9012, description: 'Longitud de la ubicación' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 5, description: 'Límite de resultados' })
  @ApiQuery({ name: 'radiusMeters', type: Number, required: false, example: 1000, description: 'Radio en metros' })
  @ApiOkResponse({ type: [NearbyStopDto] })
  async findNearbyStops(
    @Query('lat', new ParseFloatPipe()) lat: number,
    @Query('lon', new ParseFloatPipe()) lon: number,
    @Query('limit', new DefaultValuePipe(5), new ParseIntPipe()) limit: number,
    @Query('radiusMeters', new DefaultValuePipe(1000), new ParseIntPipe()) radiusMeters: number,
  ): Promise<NearbyStopDto[]> {
        try {
      return await this.stopService.findNearbyStops(lat, lon, limit, radiusMeters);
    } catch (err) {
      // Log full error so we can see stack trace in server console during debugging
      // eslint-disable-next-line no-console
      console.error('Error in GET /stop/nearby', { lat, lon, limit, radiusMeters, err });
      throw err;
    }
   // return await this.stopService.findNearbyStops(lat, lon, limit, radiusMeters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una parada por id' })
  @ApiParam({ name: 'id', description: 'Id de la parada', format: 'uuid' })
  @ApiOkResponse({ type: ResponseStopDto })
  async findOne(@Param('id') id: string): Promise<ResponseStopDto> {
    return await this.stopService.findOne(id);
  }

  @Patch(':id')
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
