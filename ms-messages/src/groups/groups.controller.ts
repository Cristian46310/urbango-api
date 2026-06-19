import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { GroupMembershipService } from './services/group-membership.service';
import type { ResponseLeaveGroupDto } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddGroupMembersDto } from './dto/add-group-members.dto';
import { UpdateGroupIconDto } from './dto/update-group-icon.dto';
import { ResponseGroupDto } from './dto/response-group.dto';
import { ResponseGroupListDto } from './dto/response-group-list.dto';
import { GroupSearchQueryDto } from './dto/group-search-query.dto';
import { ResponseGroupPublicListDto } from './dto/response-group-public-list.dto';
import { ResponseGroupDetailDto } from './dto/response-group-detail.dto';
import { ResponseGroupMemberListDto } from './dto/response-group-member-list.dto';
import { UpdateGroupMemberRoleDto } from './dto/update-group-member-role.dto';
import { RemoveGroupMemberQueryDto } from './dto/remove-group-member-query.dto';
import { ResponseMembershipLogListDto } from './dto/response-membership-log-list.dto';
import { ResponseGroupMemberEnrichedDto } from './dto/response-group-member-enriched.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { RequiresCitizen } from '@/citizen/decorators/requires-citizen.decorator';
import { CitizenGuard } from '@/citizen/guards/citizen.guard';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { MessagesService } from '@/messages/messages.service';
import { ResponseMessageListDto } from '@/messages/dto/response-message-list.dto';

@ApiTags('Groups')
@ApiBearerAuth('bearer')
@Controller('groups')
@UseGuards(CitizenGuard)
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupMembershipService: GroupMembershipService,
    private readonly messagesService: MessagesService,
  ) {}

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

  @Get('public')
  @Authenticated()
  @ApiOperation({
    summary: 'Directorio de grupos públicos (HU-ENTR-3-009)',
  })
  @ApiOkResponse({ type: ResponseGroupPublicListDto })
  async findPublicDirectory(
    @Query() query: GroupSearchQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseGroupPublicListDto> {
    return this.groupMembershipService.findPublicDirectory(user.id, query);
  }

  @Get('me')
  @Authenticated()
  @ApiOperation({
    summary: 'Listar grupos donde soy miembro (para conductor/pasajeros)',
  })
  @ApiOkResponse({ type: ResponseGroupListDto })
  async findMine(
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseGroupListDto> {
    return this.groupsService.findMyGroups(user.id, pagination);
  }

  @Get(':id/membership-log')
  @Authenticated()
  @ApiOperation({
    summary: 'Log de cambios de membresía (admin, HU-ENTR-3-010)',
  })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiOkResponse({ type: ResponseMembershipLogListDto })
  async listMembershipLog(
    @Param('id') id: string,
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMembershipLogListDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.groupMembershipService.listMembershipLog(
      id,
      user.id,
      pagination,
      token,
    );
  }

  @Get(':id/members')
  @Authenticated()
  @ApiOperation({
    summary: 'Listar miembros del grupo (admin, HU-ENTR-3-010)',
  })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiOkResponse({ type: ResponseGroupMemberListDto })
  async listMembers(
    @Param('id') id: string,
    @Query() query: GroupSearchQueryDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseGroupMemberListDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.groupMembershipService.listMembers(id, user.id, query, token);
  }

  @Get(':id/messages')
  @Authenticated()
  @ApiOperation({ summary: 'Historial de mensajes de un grupo' })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiOkResponse({ type: ResponseMessageListDto })
  async findGroupMessages(
    @Param('id') id: string,
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMessageListDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.messagesService.findGroupMessages(
      id,
      user.id,
      pagination,
      token,
    );
  }

  @Get(':id')
  @Authenticated()
  @ApiOperation({ summary: 'Detalle de un grupo (HU-ENTR-3-009)' })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiOkResponse({ type: ResponseGroupDetailDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseGroupDetailDto> {
    return this.groupMembershipService.findGroupDetail(id, user.id);
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

  @Patch(':id/members/:userId/role')
  @Authenticated()
  @ApiOperation({
    summary: 'Promover o degradar miembro (admin, HU-ENTR-3-010)',
  })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiBody({ type: UpdateGroupMemberRoleDto })
  @ApiOkResponse({ type: ResponseGroupMemberEnrichedDto })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateGroupMemberRoleDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseGroupMemberEnrichedDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.groupMembershipService.updateMemberRole(
      id,
      user.id,
      userId,
      dto.role,
      token,
    );
  }

  @Delete(':id/members/:userId')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover miembro del grupo (admin, HU-ENTR-3-010)',
  })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiOkResponse({
    description: 'Confirmación de remoción',
    schema: {
      type: 'object',
      properties: {
        groupId: { type: 'string', format: 'uuid' },
        userId: { type: 'string' },
        removedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Query() query: RemoveGroupMemberQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ groupId: string; userId: string; removedAt: Date }> {
    return this.groupMembershipService.removeMember(id, user.id, userId, {
      block: query.block,
      reason: query.reason,
    });
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

  @Post(':id/leave')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Abandonar un grupo al que pertenezco' })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiOkResponse({
    description: 'Confirmación de salida',
    schema: {
      type: 'object',
      properties: {
        groupId: { type: 'string', format: 'uuid' },
        leftAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async leave(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseLeaveGroupDto> {
    return this.groupsService.leave(id, user.id);
  }
}
