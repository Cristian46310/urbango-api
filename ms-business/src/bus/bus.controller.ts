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
import { BusService } from './bus.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ResponseBusDto } from './dto/response-bus.dto';
import { ResponseBusListDto } from './dto/response-bus-list.dto';

@ApiTags('Buses')
@Controller('bus')
export class BusController {
  constructor(private readonly busService: BusService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un bus' })
  @ApiCreatedResponse({ type: ResponseBusDto })
  create(@Body() createBusDto: CreateBusDto) {
    return this.busService.create(createBusDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar buses' })
  @ApiOkResponse({ type: ResponseBusListDto })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.busService.findAll(paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un bus por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusDto })
  findOne(@Param('id') id: string) {
    return this.busService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un bus por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusDto })
  update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
    return this.busService.update(id, updateBusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un bus por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id') id: string) {
    return this.busService.remove(id);
  }
}
