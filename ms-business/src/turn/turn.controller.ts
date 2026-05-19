import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { TurnService } from './turn.service';
import { CreateTurnDto } from './dto/create-turn.dto';
import { UpdateTurnDto } from './dto/update-turn.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { StartTurnRequestDto } from './dto/start-turn-request.dto';
import { StartTurnResponseDto } from './dto/start-turn-response.dto';

type RequestWithDriver = Request & {
  user?: {
    driverId?: string;
  };
};

@Controller('turn')
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Post()
  create(@Body() createTurnDto: CreateTurnDto) {
    return this.turnService.create(createTurnDto);
  }

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startTurn(
    @Body() dto: StartTurnRequestDto,
    @Req() req: RequestWithDriver,
  ): Promise<StartTurnResponseDto> {
    const driverId = req.user?.driverId;
    if (!driverId) {
      throw new UnauthorizedException('Token inválido o ausente');
    }

    const result = await this.turnService.startTurn(
      driverId,
      dto.busStatus,
      dto.observations,
    );

    return { success: true, message: 'Turno iniciado', ...result };
  }

  @Get()
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.turnService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.turnService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTurnDto: UpdateTurnDto) {
    return this.turnService.update(id, updateTurnDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.turnService.remove(id);
  }
}
