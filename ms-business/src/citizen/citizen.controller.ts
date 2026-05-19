import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CitizenService } from './citizen.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import type { JwtPayload } from '@/auth/types';

@ApiTags('Citizens')
@ApiBearerAuth('bearer')
@Controller('citizen')
export class CitizenController {
  constructor(private readonly citizenService: CitizenService) {}

  @Post()
  @Authenticated()
  @ApiOperation({
    summary: 'Registrar perfil de ciudadano (userId desde token)',
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

  @Get()
  @ApiOperation({
    summary:
      'Listar ciudadanos paginado (requiere permiso RBAC de administrador). Para el perfil propio use GET /citizen/me',
  })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.citizenService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citizenService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCitizenDto: UpdateCitizenDto) {
    return this.citizenService.update(id, updateCitizenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citizenService.remove(id);
  }
}
