import { ChildEntity, JoinColumn, ManyToOne } from 'typeorm';
import { Person } from '@/shared/entities/person.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';

@ChildEntity('supervisor')
export class Supervisor extends Person {
  @ManyToOne(() => Enterprise, (enterprise) => enterprise.supervisors, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'enterpriseId' })
  enterprise!: Enterprise;
}
