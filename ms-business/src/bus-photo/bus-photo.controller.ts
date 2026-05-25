import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { BusPhotoService } from './bus-photo.service';
import { ResponseBusPhotoDto } from './dto/response-bus-photo.dto';
import { BusPhotoStorageFile } from './bus-photo-storage.service';
import { SecurityGuard } from '@/auth/guards/security.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { BusService } from '@/bus/bus.service';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

@ApiTags('Bus photos')
@Controller('bus-photo')
export class BusPhotoController {
  constructor(
    private readonly busPhotoService: BusPhotoService,
    private readonly busService: BusService,
  ) {}

  private async resolveEnterpriseId(user: JwtPayload): Promise<string> {
    if (!user?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.busService.resolveEnterpriseIdForUser(user.id);
  }

  private toStorageFile(file: Express.Multer.File): BusPhotoStorageFile {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Only JPEG, PNG, and WebP images are allowed. Received: ${file.mimetype}`,
      );
    }

    if (file.size > MAX_SIZE) {
      throw new BadRequestException(
        `File size must not exceed 10 MB. Received: ${file.size} bytes`,
      );
    }

    return {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  @Post('bus/:busId')
  @UseGuards(SecurityGuard)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir foto de un bus (requiere autenticación)' })
  @ApiParam({ name: 'busId', format: 'uuid' })
  @ApiCreatedResponse({ type: ResponseBusPhotoDto })
  async upload(
    @Param('busId') busId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseBusPhotoDto> {
    const enterpriseId = await this.resolveEnterpriseId(user);
    await this.busService.assertBusBelongsToEnterprise(busId, enterpriseId);
    return this.busPhotoService.upsertForBus(
      busId,
      this.toStorageFile(file),
    );
  }

  @Get('bus/:busId')
  @ApiOperation({ summary: 'Obtener foto de un bus por id del bus' })
  @ApiParam({ name: 'busId', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusPhotoDto })
  findByBus(@Param('busId') busId: string) {
    return this.busPhotoService.findByBusId(busId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener foto de bus por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusPhotoDto })
  findOne(@Param('id') id: string) {
    return this.busPhotoService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar foto de un bus (requiere autenticación)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Foto eliminada' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const photo = await this.busPhotoService.findOne(id);
    const enterpriseId = await this.resolveEnterpriseId(user);
    await this.busService.assertBusBelongsToEnterprise(
      photo.busId,
      enterpriseId,
    );
    await this.busPhotoService.remove(id);
  }
}
