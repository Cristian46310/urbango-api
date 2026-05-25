import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { BoardingService } from './boarding.service';
import { BoardingRequestDto } from './dto/boarding-request.dto';
import { BoardingResponseDto } from './dto/boarding-response.dto';

type RequestWithCitizen = Request & {
  user?: {
    citizenId?: string;
  };
};

@ApiTags('boarding')
@Controller('boarding')
export class BoardingController {
  constructor(private readonly boardingService: BoardingService) {}

  @Post()
  @ApiCreatedResponse({ type: BoardingResponseDto })
  board(
    @Body() boardingRequestDto: BoardingRequestDto,
    @Req() req: RequestWithCitizen,
  ): Promise<BoardingResponseDto> {
    return this.boardingService.board(boardingRequestDto,   req.user?.citizenId);
  }
}
