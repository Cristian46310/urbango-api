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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AlightTicketDto } from './dto/alight-ticket.dto';
import { AlightResponseDto } from './dto/alight-response.dto';
import { ResponseTicketDto } from './dto/response-ticket.dto';
import { ResponseCitizenTicketListDto } from './dto/response-citizen-ticket-list.dto';
import { ResponseTripDetailsDto } from '@/history/dto/response-trip-details.dto';
import { HistoryService } from '@/history/history.service';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { ProfileContextService } from '@/auth/services/profile-context.service';

@ApiTags('Ticket')
@Controller('ticket')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly historyService: HistoryService,
    private readonly profileContext: ProfileContextService,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: ResponseTicketDto })
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketService.create(createTicketDto);
  }

  @Get('me')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Listar boletos del ciudadano autenticado',
  })
  @ApiOkResponse({ type: ResponseCitizenTicketListDto })
  async findMine(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: TicketQueryDto,
  ) {
    const citizenId = await this.profileContext.requireCitizenId(currentUser);
    return this.ticketService.findForCitizen(citizenId, query);
  }

  @Get()
  @ApiOkResponse({ type: ResponseTicketDto })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.ticketService.findAll(pagination);
  }

  @Get(':id/trip-details')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Recorrido detallado del viaje (HU-ENTR-2-005): ruta, validaciones, bus y conductor',
  })
  @ApiOkResponse({ type: ResponseTripDetailsDto })
  async getTripDetails(
    @Param('id') ticketId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const citizenId = await this.profileContext.requireCitizenId(currentUser);
    return this.historyService.getTripDetailsByTicketId(ticketId, citizenId);
  }

  @Get(':id')
  @ApiOkResponse({ type: ResponseTicketDto })
  findOne(@Param('id') id: string) {
    return this.ticketService.findOne(id);
  }

  @Put(':id')
  @ApiOkResponse({ type: ResponseTicketDto })
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketService.update(id, updateTicketDto);
  }

  @Post(':id/alight')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Descenso y cierre de viaje (ciudadano autenticado)',
  })
  @ApiOkResponse({ type: AlightResponseDto })
  async alight(
    @Param('id') ticketId: string,
    @Body() alightTicketDto: AlightTicketDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const citizenId = await this.profileContext.requireCitizenId(currentUser);
    return this.ticketService.alightTicket(
      ticketId,
      alightTicketDto,
      citizenId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketService.remove(id);
  }
}
