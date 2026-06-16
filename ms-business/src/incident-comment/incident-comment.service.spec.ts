import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IncidentCommentService } from './incident-comment.service';
import { IncidentComment } from './entities/incident-comment.entity';
import { Incident } from '@/incident/entities/incident.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('IncidentCommentService', () => {
  let service: IncidentCommentService;
  let incidentRepo: ReturnType<typeof createMockRepository<Incident>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentCommentService,
        provideMockRepo(IncidentComment),
        provideMockRepo(Incident),
      ],
    }).compile();

    service = module.get(IncidentCommentService);
    incidentRepo = module.get(getRepositoryToken(Incident));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('listComments throws when incident not found', async () => {
    incidentRepo.findOne.mockResolvedValue(null);
    await expect(service.listComments('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
