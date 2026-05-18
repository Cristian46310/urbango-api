import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserIdMapping } from '../entities/user-id-mapping.entity';

/**
 * Servicio para gestionar el mapeo entre ObjectIds (ms-security/MongoDB)
 * y UUIDs (ms-business/PostgreSQL)
 */
@Injectable()
export class UserIdMappingService {
  private readonly logger = new Logger(UserIdMappingService.name);

  constructor(
    @InjectRepository(UserIdMapping)
    private readonly mappingRepository: Repository<UserIdMapping>,
  ) {}

  /**
   * Crea o actualiza un mapeo entre un ObjectId y un UUID
   * Se llama cuando el usuario se autentica
   */
  async createOrUpdateMapping(
    mongoObjectId: string,
    postgresUuid: string,
  ): Promise<UserIdMapping> {
    let mapping = await this.mappingRepository.findOne({
      where: { mongoObjectId },
    });

    if (mapping) {
      // Actualizar si ya existe (por si acaso cambian el UUID)
      mapping.postgresUuid = postgresUuid;
      mapping = await this.mappingRepository.save(mapping);
      this.logger.debug(
        `✅ Updated mapping: ${mongoObjectId} -> ${postgresUuid}`,
      );
    } else {
      // Crear nuevo mapeo
      mapping = this.mappingRepository.create({
        mongoObjectId,
        postgresUuid,
      });
      mapping = await this.mappingRepository.save(mapping);
      this.logger.debug(
        `✅ Created new mapping: ${mongoObjectId} -> ${postgresUuid}`,
      );
    }

    return mapping;
  }

  /**
   * Obtiene el UUID de PostgreSQL dado un ObjectId de MongoDB
   */
  async getPostgresUuid(mongoObjectId: string): Promise<string | null> {
    const mapping = await this.mappingRepository.findOne({
      where: { mongoObjectId },
    });

    if (!mapping) {
      this.logger.warn(
        `⚠️ No mapping found for ObjectId: ${mongoObjectId}`,
      );
      return null;
    }

    return mapping.postgresUuid;
  }

  /**
   * Obtiene el ObjectId de MongoDB dado un UUID de PostgreSQL
   */
  async getMongoObjectId(postgresUuid: string): Promise<string | null> {
    const mapping = await this.mappingRepository.findOne({
      where: { postgresUuid },
    });

    if (!mapping) {
      this.logger.warn(
        `⚠️ No mapping found for PostgreSQL UUID: ${postgresUuid}`,
      );
      return null;
    }

    return mapping.mongoObjectId;
  }

  /**
   * Elimina un mapeo (útil si se necesita limpiar datos)
   */
  async deleteMapping(mongoObjectId: string): Promise<void> {
    await this.mappingRepository.delete({ mongoObjectId });
    this.logger.debug(`🗑️ Deleted mapping for ObjectId: ${mongoObjectId}`);
  }
}
