import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GpsService } from './gps.service';
import { CreateGpsDto } from './dto/create-gps.dto';
import { UpdateGpsDto } from './dto/update-gps.dto';
import { ResponseGpsDto } from './dto/response-gps.dto';
import { ResponseGpsListDto } from './dto/response-gps-list.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('GPS')
@ApiBearerAuth('bearer')
@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('bus/:busId')
  @ApiOperation({ summary: 'Registrar posición GPS de un bus' })
  @ApiParam({ name: 'busId', format: 'uuid' })
  @ApiCreatedResponse({ type: ResponseGpsDto })
  create(@Param('busId') busId: string, @Body() dto: CreateGpsDto) {
    return this.gpsService.create(busId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros GPS' })
  @ApiOkResponse({ type: ResponseGpsListDto })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.gpsService.findAll(pagination);
  }

  @Get('bus/:busId')
  @ApiOperation({ summary: 'Obtener GPS de un bus' })
  @ApiParam({ name: 'busId', format: 'uuid' })
  @ApiOkResponse({ type: ResponseGpsDto })
  findByBus(@Param('busId') busId: string) {
    return this.gpsService.findByBusId(busId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener registro GPS por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseGpsDto })
  findOne(@Param('id') id: string) {
    return this.gpsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar registro GPS' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseGpsDto })
  update(@Param('id') id: string, @Body() dto: UpdateGpsDto) {
    return this.gpsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar registro GPS' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Registro GPS eliminado' })
  async remove(@Param('id') id: string) {
    await this.gpsService.remove(id);
  }
}
