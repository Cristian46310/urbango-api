import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ResponseTripDetailsDto } from './dto/response-trip-details.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseHistoryDto } from './dto/response-history.dto';
import { ResponseHistoryListDto } from './dto/response-history-list.dto';

@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  @ApiCreatedResponse({ type: ResponseHistoryDto })
  create(@Body() createHistoryDto: CreateHistoryDto) {
    return this.historyService.create(createHistoryDto);
  }

  @Get()
  @ApiOkResponse({ type: ResponseHistoryListDto })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.historyService.findAll(paginationQuery);
  }

  @Get(':id')
  @ApiOkResponse({ type: ResponseHistoryDto })
  findOne(@Param('id') id: string) {
    return this.historyService.findOne(id);
  }

  @Get(':id/trip-details')
  @ApiOperation({
    summary: 'Obtener detalles del viaje a partir de un history id',
  })
  @ApiParam({ name: 'id', description: 'Id del history', format: 'uuid' })
  @ApiOkResponse({ type: ResponseTripDetailsDto })
  async getTripDetails(@Param('id') id: string) {
    return await this.historyService.getTripDetails(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ResponseHistoryDto })
  update(@Param('id') id: string, @Body() updateHistoryDto: UpdateHistoryDto) {
    return this.historyService.update(id, updateHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historyService.remove(id);
  }
}
