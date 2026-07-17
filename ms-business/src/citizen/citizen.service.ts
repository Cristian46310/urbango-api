import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Citizen } from './entities/citizen.entity';
import { Address } from '@/address/entities/address.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseCitizenDto } from './dto/response-citizen.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { SecurityProfileRole } from '@/auth/services/security-role-client.service';
import { ProfileRoleOutboxService } from '@/auth/services/profile-role-outbox.service';

export type CreateCitizenInput = CreateCitizenDto & { userId: string };

@Injectable()
export class CitizenService {
  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly profileRoleOutbox: ProfileRoleOutboxService,
    private readonly dataSource: DataSource,
  ) {}

  private async assertUniqueCitizenFields(
    fields: { document?: string; email?: string; userId?: string },
    excludeId?: string,
  ): Promise<void> {
    if (fields.userId) {
      const existingByUser = await this.citizenRepository.findOne({
        where: { userId: fields.userId },
      });
      if (existingByUser && existingByUser.id !== excludeId) {
        throw new ConflictException(
          'Ya existe un perfil de ciudadano para este usuario',
        );
      }
    }

    if (fields.document) {
      const existingByDocument = await this.citizenRepository.findOne({
        where: { document: fields.document },
      });
      if (existingByDocument && existingByDocument.id !== excludeId) {
        throw new ConflictException(
          'Ya existe un ciudadano con este documento',
        );
      }
    }

    if (fields.email) {
      const existingByEmail = await this.citizenRepository.findOne({
        where: { email: fields.email },
      });
      if (existingByEmail && existingByEmail.id !== excludeId) {
        throw new ConflictException(
          'Ya existe un ciudadano con este correo electrónico',
        );
      }
    }
  }

  async create(input: CreateCitizenInput) {
    await this.assertUniqueCitizenFields({
      userId: input.userId,
      document: input.document,
      email: input.email,
    });

    if (input.addressId) {
      const addr = await this.addressRepository.findOne({
        where: { id: input.addressId },
      });
      if (!addr) throw new BadRequestException('Address not found');
    }

    const citData: Partial<Citizen> = {
      name: input.name,
      document: input.document,
      email: input.email,
      phone: input.phone,
      userId: input.userId,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      address: input.addressId
        ? ({ id: input.addressId } as Address)
        : undefined,
    };
    const cit = this.citizenRepository.create(citData);
    const { saved, outboxId } = await this.dataSource.transaction(
      async (manager) => {
        const savedCitizen = await manager.getRepository(Citizen).save(cit);
        const outbox = await this.profileRoleOutbox.enqueue(manager, {
          userId: input.userId,
          profileId: savedCitizen.id,
          profileType: 'citizen',
          role: SecurityProfileRole.CITIZEN,
        });
        return { saved: savedCitizen, outboxId: outbox.id };
      },
    );
    await this.profileRoleOutbox.tryProcessSoon(outboxId);
    return plainToInstance(ResponseCitizenDto, saved);
  }

  async findByUserId(userId: string) {
    const cit = await this.citizenRepository.findOne({
      where: { userId },
      relations: ['address'],
    });
    if (!cit) {
      throw new NotFoundException('Citizen profile not found for this user');
    }
    return plainToInstance(ResponseCitizenDto, cit);
  }

  private buildPaginationMeta(page: number, limit: number, totalItems: number) {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [items, totalItems] = await this.citizenRepository.findAndCount({
      relations: ['address'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseCitizenDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const cit = await this.citizenRepository.findOne({
      where: { id },
      relations: ['address'],
    });
    if (!cit) throw new NotFoundException(`Citizen ${id} not found`);
    return plainToInstance(ResponseCitizenDto, cit);
  }

  async update(id: string, updateCitizenDto: UpdateCitizenDto) {
    await this.assertUniqueCitizenFields(
      {
        document: updateCitizenDto.document,
        email: updateCitizenDto.email,
      },
      id,
    );

    if (updateCitizenDto.addressId) {
      const addr = await this.addressRepository.findOne({
        where: { id: updateCitizenDto.addressId },
      });
      if (!addr) throw new BadRequestException('Address not found');
    }
    const preloadData: Partial<Citizen> = {
      id,
      name: updateCitizenDto.name,
      document: updateCitizenDto.document,
      email: updateCitizenDto.email,
      phone: updateCitizenDto.phone,
      birthDate: updateCitizenDto.birthDate
        ? new Date(updateCitizenDto.birthDate)
        : undefined,
      address: updateCitizenDto.addressId
        ? ({ id: updateCitizenDto.addressId } as Address)
        : undefined,
    };
    const cit = await this.citizenRepository.preload(preloadData);
    if (!cit) throw new NotFoundException(`Citizen ${id} not found`);
    const saved = await this.citizenRepository.save(cit);
    return plainToInstance(ResponseCitizenDto, saved);
  }

  async remove(id: string) {
    const cit = await this.citizenRepository.findOne({ where: { id } });
    if (!cit) throw new NotFoundException(`Citizen ${id} not found`);
    await this.citizenRepository.delete(id);
    return;
  }
}
