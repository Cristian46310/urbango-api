import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { ResponseMessageDto } from './dto/response-message.dto';
import { ResponseMessageListDto } from './dto/response-message-list.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Messages')
@Controller('messages')
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
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMessageDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.messagesService.sendDirectMessage(user.id, dto, token);
  }

  @Get('sent')
  @Authenticated()
  @ApiOperation({ summary: 'Listar mensajes enviados' })
  @ApiOkResponse({ type: ResponseMessageListDto })
  async findSent(
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseMessageListDto> {
    return this.messagesService.findSentMessages(user.id, pagination);
  }

  @Patch(':id/read')
  @Authenticated()
  @ApiOperation({ summary: 'Marcar mensaje como leído' })
  @ApiParam({ name: 'id', description: 'ID del mensaje' })
  @ApiOkResponse({ type: ResponseMessageDto })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseMessageDto> {
    return this.messagesService.markAsRead(id, user.id);
  }
}
