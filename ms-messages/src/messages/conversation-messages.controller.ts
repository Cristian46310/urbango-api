import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { ResponseMessageListDto } from './dto/response-message-list.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationMessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':id/messages')
  @Authenticated()
  @ApiOperation({ summary: 'Historial de mensajes de una conversación' })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  @ApiOkResponse({ type: ResponseMessageListDto })
  async findMessages(
    @Param('id') id: string,
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMessageListDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.messagesService.findConversationMessages(
      id,
      user.id,
      pagination,
      token,
    );
  }
}
