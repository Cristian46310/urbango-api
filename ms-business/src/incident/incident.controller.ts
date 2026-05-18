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
   * ✅ ENDPOINT PROTEGIDO: Solo drivers pueden reportar incidentes
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
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'severity', 'description', 'latitude', 'longitude'],
      properties: {
        type: {
          type: 'string',
          enum: ['mechanical', 'accident', 'delay', 'other'],
          example: 'mechanical',
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          example: 'high',
        },
        description: {
          type: 'string',
          example: 'El bus presenta una falla en el motor',
        },
        latitude: {
          type: 'number',
          example: 4.8156,
          description: 'Latitud GPS actual',
        },
        longitude: {
          type: 'number',
          example: -75.5149,
          description: 'Longitud GPS actual',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2026-05-17T23:10:00.000Z',
          description: 'Timestamp del evento (opcional)',
        },
        photos: {
          type: 'array',
          maxItems: 5,
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('photos', 5, incidentUploadOptions))
  async createByDriver(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateIncidentDriverDto,
    @UploadedFiles() photos: UploadedIncidentFile[] = [],
  ) {
    console.log('🔵 createByDriver called with:', { currentUser, dto, photosCount: photos.length });
    try {
      const result = await this.incidentService.createByDriver(currentUser, dto, photos);
      console.log('✅ Result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in createByDriver:', error);
      throw error;
    }
  }
}

