import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Perfil conductor en la tabla compartida `persons` (ms-business). Solo lectura. */
@Entity('persons')
export class DriverProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar' })
  type!: string;
}
