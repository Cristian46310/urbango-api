import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@/auth/decorators/public.decorator';
import { InternalKeyGuard } from '@/auth/guards/internal-key.guard';
import { SchedulerService } from './scheduler.service';
import { SchedulerQueryDto } from './dto/scheduler-query.dto';
import { ResponseSchedulerDto } from './dto/response-scheduler.dto';
import { ResponseSchedulerListDto } from './dto/response-scheduler-list.dto';

/**
 * Read-only scheduler API for ms-ai (and other M2M consumers).
 * Contract version: /internal/v1 — do not share Nest DTOs via npm; consumers map JSON.
 */
@ApiTags('internal-v1-scheduler')
@ApiHeader({ name: 'X-Internal-Key', required: true })
@ApiHeader({ name: 'X-Correlation-Id', required: false })
@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/v1/scheduler')
export class InternalSchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get()
  @ApiOperation({
    summary: 'List route schedules (M2M read-only for ms-ai)',
  })
  @ApiOkResponse({ type: ResponseSchedulerListDto })
  findAll(@Query() query: SchedulerQueryDto) {
    return this.schedulerService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by id (M2M read-only)' })
  @ApiOkResponse({ type: ResponseSchedulerDto })
  findOne(@Param('id') id: string) {
    return this.schedulerService.findOne(id);
  }
}
