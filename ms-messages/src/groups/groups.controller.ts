import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddGroupMembersDto } from './dto/add-group-members.dto';
import { UpdateGroupIconDto } from './dto/update-group-icon.dto';
import { ResponseGroupDto } from './dto/response-group.dto';
import { ResponseGroupListDto } from './dto/response-group-list.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { RequiresCitizen } from '@/citizen/decorators/requires-citizen.decorator';
import { CitizenGuard } from '@/citizen/guards/citizen.guard';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Groups')
@ApiBearerAuth('bearer')
@Controller('groups')
@UseGuards(CitizenGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Authenticated()
  @RequiresCitizen()
  @ApiOperation({
    summary: 'Crear grupo de interés (solo ciudadano registrado)',
  })
  @ApiBody({ type: CreateGroupDto })
  @ApiCreatedResponse({ type: ResponseGroupDto })
  async create(
    @Body() dto: CreateGroupDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseGroupDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.groupsService.create(user.id, dto, token);
  }

  @Get()
  @Authenticated()
  @ApiOperation({
    summary: 'Listar grupos públicos y grupos donde soy miembro',
  })
  @ApiOkResponse({ type: ResponseGroupListDto })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseGroupListDto> {
    return this.groupsService.findAll(user.id, pagination);
  }

  @Post(':id/members')
  @Authenticated()
  @RequiresCitizen()
  @ApiOperation({
    summary: 'Agregar miembros al grupo (admin, solo ciudadano registrado)',
  })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiBody({ type: AddGroupMembersDto })
  @ApiOkResponse({ type: ResponseGroupDto })
  async addMembers(
    @Param('id') id: string,
    @Body() dto: AddGroupMembersDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseGroupDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.groupsService.addMembers(id, user.id, dto, token);
  }

  @Post(':id/join')
  @Authenticated()
  @RequiresCitizen()
  @ApiOperation({
    summary: 'Unirse a un grupo público (solo ciudadano registrado)',
  })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiOkResponse({ type: ResponseGroupDto })
  async join(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseGroupDto> {
    return this.groupsService.join(id, user.id);
  }

  @Post(':id/icon')
  @Authenticated()
  @RequiresCitizen()
  @ApiOperation({
    summary: 'Actualizar ícono del grupo (admin, solo ciudadano registrado)',
  })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiBody({ type: UpdateGroupIconDto })
  @ApiOkResponse({ type: ResponseGroupDto })
  async updateIcon(
    @Param('id') id: string,
    @Body() dto: UpdateGroupIconDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseGroupDto> {
    return this.groupsService.updateIcon(id, user.id, dto);
  }
}
