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
import { EndTurnResponseDto } from './dto/end-turn-response.dto';
import { CurrentTurnResponseDto } from './dto/current-turn-response.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
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
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Crear turno (ADMIN)' })
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

  @Post('end')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalizar turno en progreso del conductor autenticado',
  })
  @ApiOkResponse({ type: EndTurnResponseDto })
  async endTurn(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<EndTurnResponseDto> {
    const driverId = await this.profileContext.requireDriverId(currentUser);
    const result = await this.turnService.endTurn(driverId);
    return { success: true, message: 'Turno finalizado', ...result };
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

  @Get('current')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Turno activo del conductor autenticado (sincronizar UI; null lógico si no hay in_progress)',
  })
  @ApiOkResponse({ type: CurrentTurnResponseDto })
  async getCurrentTurn(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<CurrentTurnResponseDto> {
    const driverId = await this.profileContext.requireDriverId(currentUser);
    return this.turnService.getCurrentTurn(driverId);
  }

  @Get()
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Listar turnos paginado (ADMIN)' })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.turnService.findAll(pagination);
  }

  @Get(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Detalle de turno (ADMIN)' })
  findOne(@Param('id') id: string) {
    return this.turnService.findOne(id);
  }

  @Put(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Actualizar turno (ADMIN)' })
  update(@Param('id') id: string, @Body() updateTurnDto: UpdateTurnDto) {
    return this.turnService.update(id, updateTurnDto);
  }

  @Delete(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Eliminar turno (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.turnService.remove(id);
  }
}
