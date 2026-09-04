import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TurnAssignedListener } from './turn-assigned.listener';
import { Turn, TurnStatus } from '../entities/turn.entity';
import { NotificationDispatcher } from '@/notifications/application/notification.dispatcher';
import { TurnAssignedEvent } from '../events/turn-assigned.event';
import type { NotificationRequest } from '@/notifications/domain/notification.types';

describe('TurnAssignedListener', () => {
  let listener: TurnAssignedListener;
  let turnRepository: { findOne: jest.Mock };
  let dispatcher: { send: jest.Mock };

  beforeEach(async () => {
    turnRepository = { findOne: jest.fn() };
    dispatcher = { send: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnAssignedListener,
        { provide: getRepositoryToken(Turn), useValue: turnRepository },
        { provide: NotificationDispatcher, useValue: dispatcher },
      ],
    }).compile();

    listener = module.get(TurnAssignedListener);
  });

  it('skips notification when driver has no email', async () => {
    turnRepository.findOne.mockResolvedValue({
      id: 'turn-1',
      startTime: new Date('2026-07-26T12:00:00.000Z'),
      endTime: new Date('2026-07-26T20:00:00.000Z'),
      status: TurnStatus.SCHEDULED,
      driver: { id: 'd1', name: 'Ana', email: '' },
      bus: { plate: 'ABC-123' },
    });

    await listener.handle(new TurnAssignedEvent('turn-1'));

    expect(dispatcher.send.mock.calls).toHaveLength(0);
  });

  it('dispatches TURN_ASSIGNED email when driver has email', async () => {
    turnRepository.findOne.mockResolvedValue({
      id: 'turn-1',
      startTime: new Date('2026-07-26T12:00:00.000Z'),
      endTime: new Date('2026-07-26T20:00:00.000Z'),
      status: TurnStatus.SCHEDULED,
      driver: { id: 'd1', name: 'Ana Pérez', email: 'ana@example.com' },
      bus: { plate: 'ABC-123' },
    });

    await listener.handle(new TurnAssignedEvent('turn-1'));

    expect(dispatcher.send.mock.calls).toHaveLength(1);
    const firstCall = dispatcher.send.mock.calls[0] as
      | [NotificationRequest]
      | undefined;
    const payload = firstCall?.[0];
    expect(payload).toBeDefined();
    expect(payload!.type).toBe('TURN_ASSIGNED');
    expect(payload!.channels).toEqual(['email']);
    expect(payload!.recipient.email).toBe('ana@example.com');
    expect(payload!.recipient.name).toBe('Ana Pérez');
    expect(payload!.data.plate).toBe('ABC-123');
    expect(payload!.data.status).toBe(TurnStatus.SCHEDULED);
  });
});
