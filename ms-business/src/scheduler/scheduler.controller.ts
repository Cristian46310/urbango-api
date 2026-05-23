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
import { SchedulerService } from './scheduler.service';
import { CreateSchedulerDto } from './dto/create-scheduler.dto';
import { UpdateSchedulerDto } from './dto/update-scheduler.dto';
import { SchedulerQueryDto } from './dto/scheduler-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ResponseSchedulerDto } from './dto/response-scheduler.dto';
import { ResponseSchedulerListDto } from './dto/response-scheduler-list.dto';

@ApiTags('scheduler')
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post()
  @ApiOperation({ summary: 'Create scheduler' })
  @ApiCreatedResponse({ type: ResponseSchedulerDto })
  create(@Body() createSchedulerDto: CreateSchedulerDto) {
    return this.schedulerService.create(createSchedulerDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Consulta de horarios (paginado, por defecto estado programado)',
  })
  @ApiOkResponse({ type: ResponseSchedulerListDto })
  findAll(@Query() query: SchedulerQueryDto) {
    return this.schedulerService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ResponseSchedulerDto })
  @ApiNotFoundResponse({ description: 'Scheduler not found' })
  findOne(@Param('id') id: string) {
    return this.schedulerService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSchedulerDto: UpdateSchedulerDto,
  ) {
    return this.schedulerService.update(id, updateSchedulerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schedulerService.remove(id);
  }
}
