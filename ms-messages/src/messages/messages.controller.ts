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
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { CreateGroupMessageDto } from './dto/create-group-message.dto';
import { ResponseMessageDto } from './dto/response-message.dto';
import { ResponseMessageListDto } from './dto/response-message-list.dto';
import { ResponseGroupMessageListDto } from './dto/response-group-message-list.dto';
import { ResponseMessageReadsDto } from './dto/response-message-reads.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { RequiresDriver } from '@/driver/decorators/requires-driver.decorator';
import { DriverGuard } from '@/driver/guards/driver.guard';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(DriverGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('direct')
  @Authenticated()
  @ApiOperation({ summary: 'Enviar mensaje directo a otra persona' })
  @ApiBody({ type: CreateDirectMessageDto })
  @ApiCreatedResponse({ type: ResponseMessageDto })
  async sendDirect(
    @Body() dto: CreateDirectMessageDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseMessageDto> {
    return this.messagesService.sendDirectMessage(user.id, dto);
  }

  @Post('group')
  @Authenticated()
  @RequiresDriver()
  @ApiOperation({
    summary: 'Enviar mensaje a uno o varios grupos (solo conductor registrado)',
  })
  @ApiBody({ type: CreateGroupMessageDto })
  @ApiCreatedResponse({ type: ResponseGroupMessageListDto })
  async sendGroup(
    @Body() dto: CreateGroupMessageDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseGroupMessageListDto> {
    return this.messagesService.sendGroupMessage(user.id, dto);
  }

  @Get('sent')
  @Authenticated()
  @ApiOperation({ summary: 'Listar mensajes enviados' })
  @ApiOkResponse({ type: ResponseMessageListDto })
  async findSent(
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMessageListDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.messagesService.findSentMessages(user.id, pagination, token);
  }

  @Get(':id')
  @Authenticated()
  @ApiOperation({
    summary:
      'Obtener mensaje por ID y marcarlo como leído si el usuario es destinatario',
  })
  @ApiParam({ name: 'id', description: 'ID del mensaje' })
  @ApiOkResponse({ type: ResponseMessageDto })
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMessageDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.messagesService.getMessageById(id, user.id, token);
  }

  @Get(':id/reads')
  @Authenticated()
  @ApiOperation({
    summary: 'Ver quién leyó un mensaje grupal (remitente o admin)',
  })
  @ApiParam({ name: 'id', description: 'ID del mensaje' })
  @ApiOkResponse({ type: ResponseMessageReadsDto })
  async getReads(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseMessageReadsDto> {
    return this.messagesService.getMessageReads(id, user.id);
  }

  @Patch(':id/read')
  @Authenticated()
  @ApiOperation({ summary: 'Marcar mensaje como leído' })
  @ApiParam({ name: 'id', description: 'ID del mensaje' })
  @ApiOkResponse({ type: ResponseMessageDto })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMessageDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.messagesService.markAsRead(id, user.id, token);
  }

  @Delete(':id')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar mensaje grupal inapropiado (solo admin del grupo)',
  })
  @ApiParam({ name: 'id', description: 'ID del mensaje' })
  @ApiNoContentResponse()
  async deleteMessage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.messagesService.deleteMessage(id, user.id);
  }
}
