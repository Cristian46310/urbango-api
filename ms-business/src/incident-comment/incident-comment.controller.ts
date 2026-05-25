import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { IncidentCommentService } from './incident-comment.service';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { ResponseIncidentCommentDto } from './dto/response-incident-comment.dto';
import { ResponseIncidentCommentListDto } from './dto/response-incident-comment-list.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';

@ApiTags('Incident Comments')
@Controller('incident-reports/:incidentId/comments')
export class IncidentCommentController {
  constructor(
    private readonly incidentCommentService: IncidentCommentService,
  ) {}

  @Get()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar comentarios de seguimiento de un incidente',
  })
  @ApiParam({ name: 'incidentId', format: 'uuid' })
  @ApiOkResponse({ type: ResponseIncidentCommentListDto })
  listComments(@Param('incidentId') incidentId: string) {
    return this.incidentCommentService.listComments(incidentId);
  }

  @Post()
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Agregar comentario de seguimiento a un incidente' })
  @ApiParam({ name: 'incidentId', format: 'uuid' })
  @ApiCreatedResponse({ type: ResponseIncidentCommentDto })
  addComment(
    @Param('incidentId') incidentId: string,
    @Body() dto: CreateIncidentCommentDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.incidentCommentService.addComment(incidentId, dto, currentUser);
  }
}
