import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { Ticket } from './entities/ticket.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';
import { History } from '@/history/entities/history.entity';
import { Node } from '@/node/entities/node.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';

describe('TicketService', () => {
  let service: TicketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        provideMockRepo(Ticket),
        provideMockRepo(Citizen),
        provideMockRepo(PaymentMethodCitizen),
        provideMockRepo(Scheduler),
        provideMockRepo(History),
        provideMockRepo(Node),
      ],
    }).compile();

    service = module.get(TicketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create requires schedulerId to determine amount', async () => {
    await expect(
      service.create({
        citizenId: 'c1',
        paymentMethodCitizenId: 'pmc1',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
