import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { IncidentService } from './incident.service';
import { CreateIncidentDriverDto } from './dto/create-incident-driver.dto';
import { BusIncidentQueryDto } from './dto/bus-incident-query.dto';
import { ResponseBusIncidentListDto } from './dto/response-bus-incident-list.dto';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { ResponseIncidentCommentDto } from './dto/response-incident-comment.dto';
import { ResponseIncidentCommentListDto } from './dto/response-incident-comment-list.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { ResponseIncidentDto } from './dto/response-incident.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { Public } from '@/auth/decorators/public.decorator';
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

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar todos los reportes de incidentes (público)',
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

  @Get(':incidentId/comments')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar comentarios de seguimiento de un incidente',
  })
  @ApiParam({ name: 'incidentId', format: 'uuid' })
  @ApiOkResponse({ type: ResponseIncidentCommentListDto })
  listComments(@Param('incidentId') incidentId: string) {
    return this.incidentService.listComments(incidentId);
  }

  @Post(':incidentId/comments')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Agregar comentario de seguimiento a un incidente' })
  @ApiParam({ name: 'incidentId', format: 'uuid' })
  @ApiCreatedResponse({ type: ResponseIncidentCommentDto })
  addComment(
    @Param('incidentId') incidentId: string,
    @Body() dto: CreateIncidentCommentDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.incidentService.addComment(incidentId, dto, currentUser);
  }

  @Patch(':incidentId/status')
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
