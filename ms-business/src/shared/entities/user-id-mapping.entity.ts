import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

/**
 * Mapea ObjectIds de ms-security (MongoDB) a UUIDs de ms-business (PostgreSQL)
 * Esto permite resolver el mismatch entre sistemas sin perder información
 */
@Entity('user_id_mappings')
@Unique(['mongoObjectId'])
@Index(['postgresUuid'])
export class UserIdMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mongoObjectId: string;

  @Column()
  postgresUuid: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
