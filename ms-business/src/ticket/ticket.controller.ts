import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AlightTicketDto } from './dto/alight-ticket.dto';
import { AlightResponseDto } from './dto/alight-response.dto';
import { ResponseTicketDto } from './dto/response-ticket.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Ticket')
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @ApiCreatedResponse({ type: ResponseTicketDto })
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketService.create(createTicketDto);
  }

  @Get()
  @ApiOkResponse({ type: ResponseTicketDto })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.ticketService.findAll(pagination);
  }

  @Get(':id')
  @ApiOkResponse({ type: ResponseTicketDto })
  findOne(@Param('id') id: string) {
    return this.ticketService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ResponseTicketDto })
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketService.update(id, updateTicketDto);
  }

  @Post(':id/alight')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AlightResponseDto })
  alight(
    @Param('id') ticketId: string,
    @Body() alightTicketDto: AlightTicketDto,
  ) {
    return this.ticketService.alightTicket(ticketId, alightTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketService.remove(id);
  }
}
