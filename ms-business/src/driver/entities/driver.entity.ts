import { ChildEntity, Column } from 'typeorm';
import { Person } from '../../shared/entities/person.entitie';

@ChildEntity('driver')
export class Driver extends Person {
  @Column({ nullable: true })
  licenseNumber?: string;

  @Column({ nullable: true, type: 'date' })
  licenseExpiry?: Date;
}
