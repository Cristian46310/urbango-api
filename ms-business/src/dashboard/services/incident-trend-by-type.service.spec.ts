import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IncidentTrendByTypeService } from './incident-trend-by-type.service';
import { Incident } from '@/incident/entities/incident.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { DashboardPeriodService } from './dashboard-period.service';
import { DashboardExportService } from './dashboard-export.service';
import { Repository } from 'typeorm';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockQueryBuilder } from '@/test/helpers/typeorm-mocks';

describe('IncidentTrendByTypeService', () => {
  let service: IncidentTrendByTypeService;
  let enterpriseRepo: jest.Mocked<Repository<Enterprise>>;
  let incidentRepo: jest.Mocked<Repository<Incident>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentTrendByTypeService,
        provideMockRepo(Incident),
        provideMockRepo(Enterprise),
        DashboardPeriodService,
        DashboardExportService,
      ],
    }).compile();

    service = module.get(IncidentTrendByTypeService);
    enterpriseRepo = module.get(getRepositoryToken(Enterprise));
    incidentRepo = module.get(getRepositoryToken(Incident));
    const qb = createMockQueryBuilder();
    qb.getRawMany.mockResolvedValue([]);
    incidentRepo.createQueryBuilder.mockReturnValue(qb);
  });

  it('throws when enterprise scope not found', async () => {
    enterpriseRepo.findOne.mockResolvedValue(null);
    await expect(
      service.getIncidentTrendByType(undefined, 'missing-enterprise'),
    ).rejects.toThrow(NotFoundException);
  });
});
