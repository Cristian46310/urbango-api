import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../entities/person.entitie';

/**
 * Servicio para gestionar el mapeo entre ObjectIds (ms-security/MongoDB)
 * y UUIDs (ms-business/PostgreSQL) usando el atributo mongoUserId en Person
 */
@Injectable()
export class UserIdMappingService {
  private readonly logger = new Logger(UserIdMappingService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  /**
   * Crea o actualiza el mapeo asignando el mongoUserId a una Person
   * Se llama cuando el usuario se autentica
   */
  async createOrUpdateMapping(
    mongoObjectId: string,
    postgresUuid: string,
  ): Promise<Person> {
    let person = await this.personRepository.findOne({
      where: { id: postgresUuid },
    });

    if (!person) {
      this.logger.warn(
        `⚠️ Person with UUID ${postgresUuid} not found`,
      );
      throw new Error(`Person with UUID ${postgresUuid} not found`);
    }

    person.mongoUserId = mongoObjectId;
    person = await this.personRepository.save(person);
    this.logger.debug(
      `✅ Updated mapping: ${mongoObjectId} -> ${postgresUuid}`,
    );

    return person;
  }

  /**
   * Obtiene el UUID de PostgreSQL dado un ObjectId de MongoDB
   */
  async getPostgresUuid(mongoObjectId: string): Promise<string | null> {
    const person = await this.personRepository.findOne({
      where: { mongoUserId: mongoObjectId },
    });

    if (!person) {
      this.logger.warn(
        `⚠️ No user found for ObjectId: ${mongoObjectId}`,
      );
      return null;
    }

    return person.id;
  }

  /**
   * Obtiene el ObjectId de MongoDB dado un UUID de PostgreSQL
   */
  async getMongoObjectId(postgresUuid: string): Promise<string | null> {
    const person = await this.personRepository.findOne({
      where: { id: postgresUuid },
    });

    if (!person?.mongoUserId) {
      this.logger.warn(
        `⚠️ No MongoDB mapping found for PostgreSQL UUID: ${postgresUuid}`
      );
      return null;
    }

    return person.mongoUserId;
  }

  /**
   * Elimina el mapeo (limpia el mongoUserId)
   */
  async deleteMapping(mongoObjectId: string): Promise<void> {
    await this.personRepository.update(
      { mongoUserId: mongoObjectId },
      { mongoUserId: undefined },
    );
  }
}
