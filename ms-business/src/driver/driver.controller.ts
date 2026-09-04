import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateDriverAdminDto } from './dto/create-driver-admin.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import type { JwtPayload } from '@/auth/types';
import {
  toUserPhotoStorageFile,
  userPhotoUploadOptions,
} from '@/user-photo/user-photo-upload.util';

@ApiTags('Drivers')
@ApiBearerAuth('bearer')
@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post('admin')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Crear conductor para un usuario existente y asignarle el rol DRIVER (solo ADMIN)',
  })
  createByAdmin(@Body() createDriverDto: CreateDriverAdminDto) {
    const { userId, ...profile } = createDriverDto;
    return this.driverService.createByAdmin({ ...profile, userId });
  }

  @Post()
  @Authenticated()
  @Roles('DRIVER')
  @ApiOperation({
    summary:
      'Registrar perfil de conductor (requiere rol DRIVER ya promovido en ms-security; enterpriseId en body)',
  })
  create(
    @Body() createDriverDto: CreateDriverDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.driverService.create({
      ...createDriverDto,
      userId: currentUser.id,
    });
  }

  @Get('me')
  @Authenticated()
  @ApiOperation({
    summary: 'Obtener perfil de conductor del usuario autenticado',
  })
  findMe(@CurrentUser() currentUser: JwtPayload) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.driverService.findByUserId(currentUser.id);
  }

  @Post('me/photo')
  @Authenticated()
  @UseInterceptors(FileInterceptor('photo', userPhotoUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary:
      'Subir o reemplazar foto de perfil del conductor (JPEG/PNG/WebP, máx 5 MB)',
  })
  uploadPhoto(
    @CurrentUser() currentUser: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.driverService.upsertPhotoForUser(
      currentUser.id,
      toUserPhotoStorageFile(file),
    );
  }

  @Delete('me/photo')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar foto de perfil del conductor' })
  removePhoto(@CurrentUser() currentUser: JwtPayload) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.driverService.removePhotoForUser(currentUser.id);
  }

  @Get()
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Listar conductores paginado (solo ADMIN). Perfil propio: GET /driver/me',
  })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.driverService.findAll(pagination);
  }

  @Get(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Detalle de conductor por id (solo ADMIN)' })
  findOne(@Param('id') id: string) {
    return this.driverService.findOne(id);
  }

  @Put(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar conductor por id (solo ADMIN)' })
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driverService.update(id, updateDriverDto);
  }

  @Delete(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar conductor por id (solo ADMIN)' })
  remove(@Param('id') id: string) {
    return this.driverService.remove(id);
  }
}
