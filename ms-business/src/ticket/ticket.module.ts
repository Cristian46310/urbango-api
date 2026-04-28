import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { Ticket } from './entities/ticket.entity';
import { Citizen } from 'src/citizen/entities/citizen.entity';
import { PaymentMethodCitizen } from 'src/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler } from 'src/scheduler/entities/scheduler.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      Citizen,
      PaymentMethodCitizen,
      Scheduler,
    ]),
  ],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
