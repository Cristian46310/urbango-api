import { ChildEntity, ManyToOne, OneToMany, Column } from 'typeorm';
import { Person } from '@/shared/entities/person.entity';
import { Address } from '@/address/entities/address.entity';
import { Ticket } from '@/ticket/entities/ticket.entity';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';

@ChildEntity('citizen')
export class Citizen extends Person {
  @Column({ nullable: true })
  extraInfo?: string;

  @ManyToOne(() => Address, { onDelete: 'SET NULL', eager: true })
  address?: Address;

  @OneToMany(() => Ticket, (ticket) => ticket.citizen)
  tickets?: Ticket[];

  @OneToMany(() => PaymentMethodCitizen, (pmc) => pmc.citizen)
  paymentMethods?: PaymentMethodCitizen[];
}
