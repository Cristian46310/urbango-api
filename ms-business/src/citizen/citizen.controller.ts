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
import { CitizenService } from './citizen.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import type { JwtPayload } from '@/auth/types';
import {
  toUserPhotoStorageFile,
  userPhotoUploadOptions,
} from '@/user-photo/user-photo-upload.util';

@ApiTags('Citizens')
@ApiBearerAuth('bearer')
@Controller('citizen')
export class CitizenController {
  constructor(private readonly citizenService: CitizenService) {}

  @Post()
  @Authenticated()
  @ApiOperation({
    summary: 'Registrar perfil de ciudadano (solo JWT, sin RBAC — onboarding)',
  })
  create(
    @Body() createCitizenDto: CreateCitizenDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.citizenService.create({
      ...createCitizenDto,
      userId: currentUser.id,
    });
  }

  @Get('me')
  @Authenticated()
  @ApiOperation({
    summary: 'Obtener perfil de ciudadano del usuario autenticado',
  })
  findMe(@CurrentUser() currentUser: JwtPayload) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.citizenService.findByUserId(currentUser.id);
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
      'Subir o reemplazar foto de perfil del ciudadano (JPEG/PNG/WebP, máx 5 MB)',
  })
  uploadPhoto(
    @CurrentUser() currentUser: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.citizenService.upsertPhotoForUser(
      currentUser.id,
      toUserPhotoStorageFile(file),
    );
  }

  @Delete('me/photo')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar foto de perfil del ciudadano' })
  removePhoto(@CurrentUser() currentUser: JwtPayload) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.citizenService.removePhotoForUser(currentUser.id);
  }

  @Get()
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Listar ciudadanos paginado (solo ADMIN). Perfil propio: GET /citizen/me',
  })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.citizenService.findAll(pagination);
  }

  @Get(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Detalle de ciudadano por id (solo ADMIN)' })
  findOne(@Param('id') id: string) {
    return this.citizenService.findOne(id);
  }

  @Put(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar ciudadano por id (solo ADMIN)' })
  update(@Param('id') id: string, @Body() updateCitizenDto: UpdateCitizenDto) {
    return this.citizenService.update(id, updateCitizenDto);
  }

  @Delete(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar ciudadano por id (solo ADMIN)' })
  remove(@Param('id') id: string) {
    return this.citizenService.remove(id);
  }
}
