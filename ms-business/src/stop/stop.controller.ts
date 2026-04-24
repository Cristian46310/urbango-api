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
import { StopService } from './stop.service';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { Stop } from './entities/stop.entity';

@ApiTags('Stops')
@Controller('stop')
export class StopController {
  constructor(private readonly stopService: StopService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una parada' })
  @ApiCreatedResponse({ type: Stop })
  async create(@Body() createStopDto: CreateStopDto) {
    return await this.stopService.create(createStopDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las paradas' })
  @ApiOkResponse({ type: Stop, isArray: true })
  async findAll() {
    return await this.stopService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una parada por id' })
  @ApiParam({ name: 'id', description: 'Id de la parada', format: 'uuid' })
  @ApiOkResponse({ type: Stop })
  async findOne(@Param('id') id: string) {
    return await this.stopService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una parada por id' })
  @ApiParam({ name: 'id', description: 'Id de la parada', format: 'uuid' })
  @ApiOkResponse({ type: Stop })
  async update(@Param('id') id: string, @Body() updateStopDto: UpdateStopDto) {
    return await this.stopService.update(id, updateStopDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una parada por id' })
  @ApiParam({ name: 'id', description: 'Id de la parada', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Parada eliminada' })
  async remove(@Param('id') id: string) {
    return await this.stopService.remove(id);
  }
}
