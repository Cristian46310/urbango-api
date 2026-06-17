import { Body, Controller, Headers, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { ResponseConversationDto } from './dto/response-conversation.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('direct')
  @Authenticated()
  @ApiOperation({
    summary: 'Obtener o crear conversación directa con otra persona',
  })
  @ApiBody({ type: CreateDirectConversationDto })
  @ApiCreatedResponse({ type: ResponseConversationDto })
  async createDirect(
    @Body() dto: CreateDirectConversationDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseConversationDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.conversationsService.findOrCreateDirectConversation(
      user.id,
      dto,
      token,
    );
  }
}
