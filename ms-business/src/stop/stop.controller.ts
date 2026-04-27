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
import { ResponseStopDto } from './dto/response-stop.dto';

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
  @ApiOkResponse({ type: ResponseStopDto, isArray: true })
  async findAll(): Promise<ResponseStopDto[]> {
    return await this.stopService.findAll();
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
  async update(@Param('id') id: string, @Body() updateStopDto: UpdateStopDto): Promise<ResponseStopDto> {
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
