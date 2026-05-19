import { ChildEntity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Person } from '@/shared/entities/person.entitie';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';

@ChildEntity('driver')
export class Driver extends Person {
  @Column({ nullable: true })
  licenseNumber?: string;

  @Column({ nullable: true, type: 'date' })
  licenseExpiry?: Date;

  @ManyToOne(() => Enterprise, { onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise?: Enterprise;
}
