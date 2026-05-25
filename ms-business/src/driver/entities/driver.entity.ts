import { ChildEntity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Person } from '@/shared/entities/person.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';

@ChildEntity('driver')
export class Driver extends Person {
  @Column()
  licenseNumber!: string;

  @Column({type: 'date' })
  licenseExpiry!: Date;

  @ManyToOne(() => Enterprise, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise!: Enterprise;
}
