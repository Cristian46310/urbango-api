import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassengerAgeDistributionService } from './passenger-age-distribution.service';
import { Ticket } from '@/ticket/entities/ticket.entity';

describe('PassengerAgeDistributionService', () => {
  let service: PassengerAgeDistributionService;
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    leftJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassengerAgeDistributionService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<PassengerAgeDistributionService>(
      PassengerAgeDistributionService,
    );
  });

  it('calculates age distribution and predominant segment', async () => {
    queryBuilder.getMany
      .mockResolvedValueOnce([
        {
          boardedAt: new Date('2025-04-10T10:00:00.000Z'),
          citizen: { birthDate: new Date('2010-01-01') },
        },
        {
          boardedAt: new Date('2025-04-10T10:00:00.000Z'),
          citizen: { birthDate: new Date('2003-01-01') },
        },
        {
          boardedAt: new Date('2025-04-10T10:00:00.000Z'),
          citizen: { birthDate: new Date('1990-01-01') },
        },
        {
          boardedAt: new Date('2025-04-10T10:00:00.000Z'),
          citizen: {},
        },
      ])
      .mockResolvedValueOnce([
        {
          boardedAt: new Date('2025-03-10T10:00:00.000Z'),
          citizen: { birthDate: new Date('2003-01-01') },
        },
      ]);

    const result = await service.getAgeDistribution({
      startDate: '2025-04-01',
      endDate: '2025-04-30',
    });

    expect(result.totalPassengers).toBe(4);
    expect(result.predominantSegment).toBe('Menores (0-17)');
    expect(result.segments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Menores (0-17)',
          count: 1,
          percentage: 25,
        }),
        expect.objectContaining({
          name: 'Jovenes (18-25)',
          count: 1,
          variationVsPreviousMonth: 0,
        }),
        expect.objectContaining({
          name: 'Sin informacion',
          count: 1,
        }),
      ]),
    );
  });
});
