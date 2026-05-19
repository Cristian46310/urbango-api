import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { AgeDistributionQueryDto } from './dto/age-distribution-query.dto';
import { AgeDistributionResponseDto } from './dto/age-distribution-response.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('passengers/age-distribution')
  @ApiOkResponse({ type: AgeDistributionResponseDto })
  getAgeDistribution(@Query() query: AgeDistributionQueryDto) {
    return this.analyticsService.getAgeDistribution(query);
  }

  @Get('passengers/age-distribution/export/excel')
  async exportAgeDistributionAsExcel(
    @Query() query: AgeDistributionQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } =
      await this.analyticsService.exportAgeDistributionAsExcel(query);

    response.set({
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }
}
