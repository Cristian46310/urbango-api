import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';

type UploadedIncidentFile = {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
};

mkdirSync('./uploads/incidents', { recursive: true });

const incidentUploadOptions = {
  storage: diskStorage({
    destination: './uploads/incidents',
    filename: (_: unknown, file: UploadedIncidentFile, callback) => {
      const fileExtension = extname(file.originalname);
      callback(null, `${Date.now()}-${randomUUID()}${fileExtension}`);
    },
  }),
  fileFilter: (_: unknown, file: UploadedIncidentFile, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('Only image files are allowed'), false);
      return;
    }

    callback(null, true);
  },
};

@Controller('incident-reports')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('photos', 5, incidentUploadOptions))
  create(
    @Body() dto: CreateIncidentDto,
    @UploadedFiles() photos: UploadedIncidentFile[] = [],
  ) {
    return this.incidentService.create(dto, photos);
  }
}