import { ChildEntity, ManyToOne, OneToMany, Column } from 'typeorm';
import { Person } from 'src/shared/entities/person.entitie';
import { Address } from 'src/address/entities/address.entity';
import { Ticket } from 'src/ticket/entities/ticket.entity';
import { PaymentMethodCitizen } from 'src/payment-method-citizen/entities/payment-method-citizen.entity';

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
