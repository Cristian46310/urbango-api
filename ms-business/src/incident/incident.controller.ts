import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { IncidentService } from './incident.service';
import { CreateIncidentDriverDto } from './dto/create-incident-driver.dto';
import { BusIncidentQueryDto } from './dto/bus-incident-query.dto';
import { ResponseBusIncidentListDto } from './dto/response-bus-incident-list.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { ResponseIncidentDto } from './dto/response-incident.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';

const incidentUploadOptions = {
  storage: memoryStorage(),
  fileFilter: (
    _: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Only image files are allowed'), false);
      return;
    }

    callback(null, true);
  },
};

@ApiTags('Incident Reports')
@Controller('incident-reports')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Get()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar todos los reportes de incidentes (paginado)',
  })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.incidentService.findAll(pagination);
  }

  @Get('bus/:busId')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar incidentes de un bus',
    description:
      'Devuelve incidentes ordenados por fecha, con filtros opcionales por tipo y estado, y estadísticas agregadas.',
  })
  @ApiParam({ name: 'busId', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusIncidentListDto })
  findByBus(
    @Param('busId') busId: string,
    @Query() query: BusIncidentQueryDto,
  ) {
    return this.incidentService.findByBus(busId, query);
  }

  @Post('driver')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Crear reporte de incidente del conductor',
    description:
      'El conductor autenticado reporta un incidente de su turno actual. El sistema obtiene automáticamente el driver, el turno activo y el bus asociado.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('photos', 5, incidentUploadOptions))
  async createByDriver(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateIncidentDriverDto,
    @UploadedFiles() photos: Express.Multer.File[] = [],
  ) {
    return this.incidentService.createByDriver(currentUser, dto, photos);
  }

  @Put(':incidentId/status')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Actualizar estado de un incidente' })
  @ApiParam({ name: 'incidentId', format: 'uuid' })
  @ApiOkResponse({ type: ResponseIncidentDto })
  updateStatus(
    @Param('incidentId') incidentId: string,
    @Body() dto: UpdateIncidentStatusDto,
  ) {
    return this.incidentService.updateStatus(incidentId, dto);
  }
}
