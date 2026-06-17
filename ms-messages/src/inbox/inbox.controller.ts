import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagesService } from '@/messages/messages.service';
import { ResponseMessageListDto } from '@/messages/dto/response-message-list.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { InboxQueryDto } from './dto/inbox-query.dto';
import { ResponseUnreadCountDto } from './dto/response-unread-count.dto';

@ApiTags('Inbox')
@Controller('inbox')
export class InboxController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('unread-count')
  @Authenticated()
  @ApiOperation({ summary: 'Contador de mensajes recibidos sin leer' })
  @ApiOkResponse({ type: ResponseUnreadCountDto })
  async getUnreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseUnreadCountDto> {
    const count = await this.messagesService.countUnreadInboxMessages(user.id);
    return { count };
  }

  @Get()
  @Authenticated()
  @ApiOperation({ summary: 'Bandeja de mensajes recibidos' })
  @ApiOkResponse({ type: ResponseMessageListDto })
  async findInbox(
    @Query() query: InboxQueryDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMessageListDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.messagesService.findInboxMessages(user.id, query, token);
  }
}
