import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagesService } from '@/messages/messages.service';
import { ResponseMessageListDto } from '@/messages/dto/response-message-list.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Inbox')
@Controller('inbox')
export class InboxController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Authenticated()
  @ApiOperation({ summary: 'Bandeja de mensajes recibidos' })
  @ApiOkResponse({ type: ResponseMessageListDto })
  async findInbox(
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseMessageListDto> {
    return this.messagesService.findInboxMessages(user.id, pagination);
  }
}
