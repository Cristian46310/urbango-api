import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Perfil ciudadano en la tabla compartida `persons` (ms-business). Solo lectura. */
@Entity('persons')
export class CitizenProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar' })
  type!: string;
}
