import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { BusStorageService, BusStorageFile } from './bus-storage.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Buses')
@Controller('bus')
export class BusController {
  constructor(
    private readonly busService: BusService,
    private readonly busStorageService: BusStorageService,
  ) {}

  @Post()
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar un bus en la flota de la empresa (requiere autenticación)',
  })
  @ApiCreatedResponse({ type: ResponseBusDto })
  create(
    @Body() createBusDto: CreateBusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.enterpriseId) {
      throw new BadRequestException(
        'Your user is not associated with an enterprise. Contact the administrator.',
      );
    }
    return this.busService.create(createBusDto, user.enterpriseId);
  }

  @Get('fleet')
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar buses de la flota de mi empresa (requiere autenticación)',
  })
  @ApiOkResponse({ type: ResponseBusListDto })
  findFleet(
    @Query() paginationQuery: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.enterpriseId) {
      throw new BadRequestException(
        'Your user is not associated with an enterprise. Contact the administrator.',
      );
    }
    return this.busService.findAll(paginationQuery, user.enterpriseId);
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

  @Patch(':id')
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un bus por id (requiere autenticación)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusDto })
  async update(
    @Param('id') id: string,
    @Body() updateBusDto: UpdateBusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.enterpriseId) {
      throw new BadRequestException(
        'Your user is not associated with an enterprise. Contact the administrator.',
      );
    }
    await this.busService.assertBusBelongsToEnterprise(id, user.enterpriseId);
    return this.busService.update(id, updateBusDto);
  }

  @Delete(':id')
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un bus por id (requiere autenticación)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (!user.enterpriseId) {
      throw new BadRequestException(
        'Your user is not associated with an enterprise. Contact the administrator.',
      );
    }
    return this.busService
      .assertBusBelongsToEnterprise(id, user.enterpriseId)
      .then(() => this.busService.remove(id));
  }

  @Post(':id/photo')
  @UseGuards(SecurityGuard)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir foto del bus (requiere autenticación)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: ResponseBusDto })
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseBusDto> {
    if (!user.enterpriseId) {
      throw new BadRequestException(
        'Your user is not associated with an enterprise. Contact the administrator.',
      );
    }

    await this.busService.assertBusBelongsToEnterprise(id, user.enterpriseId);

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

    const storageFile: BusStorageFile = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    const storedPhoto = await this.busStorageService.upload(storageFile);

    return this.busService.update(id, {
      photoUrl: storedPhoto.publicUrl,
    });
  }
}
