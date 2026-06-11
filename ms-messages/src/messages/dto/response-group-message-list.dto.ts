import { ApiProperty } from '@nestjs/swagger';
import { ResponseMessageDto } from './response-message.dto';

export class ResponseGroupMessageListDto {
  @ApiProperty({ type: [ResponseMessageDto] })
  items!: ResponseMessageDto[];
}
