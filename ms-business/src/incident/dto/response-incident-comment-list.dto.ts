import { ApiProperty } from '@nestjs/swagger';
import { ResponseIncidentCommentDto } from './response-incident-comment.dto';

export class ResponseIncidentCommentListDto {
  @ApiProperty({ type: [ResponseIncidentCommentDto] })
  items!: ResponseIncidentCommentDto[];
}
