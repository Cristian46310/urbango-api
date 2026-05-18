import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { Ticket } from './entities/ticket.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';
import { History } from '@/history/entities/history.entity';
import { Node } from '@/node/entities/node.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      Citizen,
      PaymentMethodCitizen,
      Scheduler,
      History,
      Node,
    ]),
  ],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
