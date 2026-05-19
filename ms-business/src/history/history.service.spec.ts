import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { HistoryService } from './history.service';
import { History } from './entities/history.entity';
import { Ticket } from '@/ticket/entities/ticket.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { Node } from '@/node/entities/node.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('HistoryService', () => {
  let service: HistoryService;
  let ticketRepo: ReturnType<typeof createMockRepository<Ticket>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        provideMockRepo(History),
        provideMockRepo(Ticket),
        provideMockRepo(Turn),
        provideMockRepo(Bus),
        provideMockRepo(Driver),
        provideMockRepo(Node),
      ],
    }).compile();

    service = module.get(HistoryService);
    ticketRepo = module.get(getRepositoryToken(Ticket));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws when ticket not found', async () => {
    ticketRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create({ ticketId: 'missing', nodeId: 'n1', order: 1 }),
    ).rejects.toThrow(BadRequestException);
  });
});
