import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BoardingService } from './boarding.service';
import { BoardingRequestDto } from './dto/boarding-request.dto';
import { BoardingResponseDto } from './dto/boarding-response.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { ProfileContextService } from '@/auth/services/profile-context.service';

@ApiTags('boarding')
@ApiBearerAuth('bearer')
@Controller('boarding')
export class BoardingController {
  constructor(
    private readonly boardingService: BoardingService,
    private readonly profileContext: ProfileContextService,
  ) {}

  @Post()
  @Authenticated()
  @ApiOperation({
    summary: 'Abordaje y generación de boleto (ciudadano autenticado)',
  })
  @ApiCreatedResponse({ type: BoardingResponseDto })
  async board(
    @Body() boardingRequestDto: BoardingRequestDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<BoardingResponseDto> {
    const citizenId = await this.profileContext.requireCitizenId(currentUser);
    return this.boardingService.board(boardingRequestDto, citizenId);
  }
}
