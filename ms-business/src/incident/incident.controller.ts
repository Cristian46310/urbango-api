import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { IncidentService } from './incident.service';
import { CreateIncidentDriverDto } from './dto/create-incident-driver.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';

type UploadedIncidentFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

const incidentUploadOptions = {
  storage: memoryStorage(),
  fileFilter: (_: unknown, file: UploadedIncidentFile, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('Only image files are allowed'), false);
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
  @ApiOperation({ summary: 'Listar todos los reportes de incidentes (público)' })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.incidentService.findAll(pagination);
  }

  /**
   * ENDPOINT PROTEGIDO: Solo drivers pueden reportar incidentes
   * Extrae automáticamente del token:
   * - ID del driver
   * - Sus roles
   * - Su turno activo
   * - El bus del turno
   */
  @Post('driver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @ApiBearerAuth()
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
    @UploadedFiles() photos: UploadedIncidentFile[] = [],
  ) {
    try {
      const result = await this.incidentService.createByDriver(currentUser, dto, photos);
      return result;
    } catch (error) {
      throw error;
    }
  }
}

