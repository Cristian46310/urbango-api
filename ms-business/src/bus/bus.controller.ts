import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { BusService } from './bus.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ResponseBusDto } from './dto/response-bus.dto';
import { ResponseBusListDto } from './dto/response-bus-list.dto';
import { SecurityGuard } from '@/auth/guards/security.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { BusPhotoService } from '@/bus-photo/bus-photo.service';
import { BusPhotoStorageFile } from '@/bus-photo/bus-photo-storage.service';
import { ResponseBusPhotoDto } from '@/bus-photo/dto/response-bus-photo.dto';

@ApiTags('Buses')
@Controller('bus')
export class BusController {
  constructor(
    private readonly busService: BusService,
    private readonly busPhotoService: BusPhotoService,
  ) {}

  private async resolveEnterpriseId(user: JwtPayload): Promise<string> {
    if (!user?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.busService.resolveEnterpriseIdForUser(user.id);
  }

  @Post()
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Registrar un bus en la flota de la empresa (requiere autenticación)',
  })
  @ApiCreatedResponse({ type: ResponseBusDto })
  async create(
    @Body() createBusDto: CreateBusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const enterpriseId = await this.resolveEnterpriseId(user);
    return this.busService.create(createBusDto, enterpriseId);
  }

  @Get('fleet')
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar buses de la flota de mi empresa (requiere autenticación)',
  })
  @ApiOkResponse({ type: ResponseBusListDto })
  async findFleet(
    @Query() paginationQuery: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const enterpriseId = await this.resolveEnterpriseId(user);
    return this.busService.findAll(paginationQuery, enterpriseId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar buses' })
  @ApiQuery({
    name: 'enterpriseId',
    required: false,
    description: 'Filtrar por empresa',
  })
  @ApiOkResponse({ type: ResponseBusListDto })
  findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('enterpriseId') enterpriseId?: string,
  ) {
    return this.busService.findAll(paginationQuery, enterpriseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un bus por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusDto })
  findOne(@Param('id') id: string) {
    return this.busService.findOne(id);
  }

  @Put(':id')
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar un bus por id (requiere autenticación)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusDto })
  async update(
    @Param('id') id: string,
    @Body() updateBusDto: UpdateBusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const enterpriseId = await this.resolveEnterpriseId(user);
    await this.busService.assertBusBelongsToEnterprise(id, enterpriseId);
    return this.busService.update(id, updateBusDto);
  }

  @Delete(':id')
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un bus por id (requiere autenticación)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const enterpriseId = await this.resolveEnterpriseId(user);
    await this.busService.assertBusBelongsToEnterprise(id, enterpriseId);
    return this.busService.remove(id);
  }

  @Post(':id/photo')
  @UseGuards(SecurityGuard)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir foto del bus (requiere autenticación)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: ResponseBusPhotoDto })
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseBusPhotoDto> {
    const enterpriseId = await this.resolveEnterpriseId(user);
    await this.busService.assertBusBelongsToEnterprise(id, enterpriseId);

    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Only JPEG, PNG, and WebP images are allowed. Received: ${file.mimetype}`,
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size must not exceed 10 MB. Received: ${file.size} bytes`,
      );
    }

    const storageFile: BusPhotoStorageFile = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    return this.busPhotoService.upsertForBus(id, storageFile);
  }
}
