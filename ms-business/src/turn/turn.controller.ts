import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TurnService } from './turn.service';
import { CreateTurnDto } from './dto/create-turn.dto';
import { UpdateTurnDto } from './dto/update-turn.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { StartTurnRequestDto } from './dto/start-turn-request.dto';
import { UpdateTurnGpsDto } from './dto/update-turn-gps.dto';
import { ResponseGpsDto } from '@/gps/dto/response-gps.dto';
import { StartTurnResponseDto } from './dto/start-turn-response.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { ProfileContextService } from '@/auth/services/profile-context.service';

@ApiTags('turn')
@Controller('turn')
export class TurnController {
  constructor(
    private readonly turnService: TurnService,
    private readonly profileContext: ProfileContextService,
  ) {}

  @Post()
  create(@Body() createTurnDto: CreateTurnDto) {
    return this.turnService.create(createTurnDto);
  }

  @Post('start')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar turno del conductor autenticado' })
  @ApiOkResponse({ type: StartTurnResponseDto })
  async startTurn(
    @Body() dto: StartTurnRequestDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<StartTurnResponseDto> {
    const driverId = await this.profileContext.requireDriverId(currentUser);
    const result = await this.turnService.startTurn(driverId, dto);
    return { success: true, message: 'Turno iniciado', ...result };
  }

  @Post('gps')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar posición GPS del bus durante turno activo',
  })
  @ApiOkResponse({ type: ResponseGpsDto })
  async updateGps(
    @Body() dto: UpdateTurnGpsDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ResponseGpsDto> {
    const driverId = await this.profileContext.requireDriverId(currentUser);
    return this.turnService.updateGpsPosition(
      driverId,
      dto.latitude,
      dto.longitude,
    );
  }

  @Get()
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.turnService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.turnService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTurnDto: UpdateTurnDto) {
    return this.turnService.update(id, updateTurnDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.turnService.remove(id);
  }
}
