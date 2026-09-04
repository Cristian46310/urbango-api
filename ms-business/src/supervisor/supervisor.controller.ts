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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupervisorService } from './supervisor.service';
import { CreateSupervisorDto } from './dto/create-supervisor.dto';
import { UpdateSupervisorDto } from './dto/update-supervisor.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import type { JwtPayload } from '@/auth/types';

@ApiTags('Supervisors')
@ApiBearerAuth('bearer')
@Controller('supervisor')
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  @Post()
  @Authenticated()
  @Roles('SUPERVISOR', 'ADMIN', 'BUSINESS_ADMIN')
  @ApiOperation({
    summary:
      'Registrar perfil de supervisor (requiere SUPERVISOR/ADMIN/BUSINESS_ADMIN; enterpriseId en body)',
  })
  create(
    @Body() createSupervisorDto: CreateSupervisorDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.supervisorService.create({
      ...createSupervisorDto,
      userId: currentUser.id,
    });
  }

  @Get('me')
  @Authenticated()
  @ApiOperation({
    summary: 'Obtener perfil de supervisor del usuario autenticado',
  })
  findMe(@CurrentUser() currentUser: JwtPayload) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.supervisorService.findByUserId(currentUser.id);
  }

  @Get()
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Listar supervisores paginado (solo ADMIN). Perfil propio: GET /supervisor/me',
  })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.supervisorService.findAll(pagination);
  }

  @Get(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Detalle de supervisor por id (solo ADMIN)' })
  findOne(@Param('id') id: string) {
    return this.supervisorService.findOne(id);
  }

  @Put(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar supervisor (solo ADMIN)' })
  update(
    @Param('id') id: string,
    @Body() updateSupervisorDto: UpdateSupervisorDto,
  ) {
    return this.supervisorService.update(id, updateSupervisorDto);
  }

  @Delete(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar supervisor (solo ADMIN)' })
  remove(@Param('id') id: string) {
    return this.supervisorService.remove(id);
  }
}
