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
import {
  UserPhotoStorageFile,
  UserPhotoStorageService,
} from '@/user-photo/user-photo-storage.service';

export type CreateCitizenInput = CreateCitizenDto & { userId: string };

@Injectable()
export class CitizenService {
  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    private readonly profileRoleOutbox: ProfileRoleOutboxService,
    private readonly dataSource: DataSource,
    private readonly userPhotoStorage: UserPhotoStorageService,
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

  private assertSingleAddressInput(input: {
    addressId?: string;
    address?: unknown;
  }): void {
    if (input.addressId && input.address) {
      throw new BadRequestException(
        'No se puede enviar address y addressId al mismo tiempo',
      );
    }
  }

  async create(input: CreateCitizenInput) {
    this.assertSingleAddressInput(input);
    await this.assertUniqueCitizenFields({
      userId: input.userId,
      document: input.document,
      email: input.email,
    });

    const { saved, outboxId } = await this.dataSource.transaction(
      async (manager) => {
        const addressRepository = manager.getRepository(Address);
        const citizenRepository = manager.getRepository(Citizen);
        let address: Address | undefined;

        if (input.addressId) {
          address =
            (await addressRepository.findOne({
              where: { id: input.addressId },
            })) ?? undefined;
          if (!address) throw new BadRequestException('Address not found');
        } else if (input.address) {
          address = await addressRepository.save(
            addressRepository.create(input.address),
          );
        }

        const cit = citizenRepository.create({
          name: input.name,
          document: input.document,
          email: input.email,
          phone: input.phone,
          userId: input.userId,
          birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
          address,
        });
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
    return this.toResponse(saved);
  }

  async findByUserId(userId: string) {
    const cit = await this.citizenRepository.findOne({
      where: { userId },
      relations: ['address'],
    });
    if (!cit) {
      throw new NotFoundException('Citizen profile not found for this user');
    }
    return this.toResponse(cit);
  }

  async upsertPhotoForUser(
    userId: string,
    file: UserPhotoStorageFile,
  ): Promise<ResponseCitizenDto> {
    const cit = await this.citizenRepository.findOne({ where: { userId } });
    if (!cit) {
      throw new BadRequestException(
        'Debe registrar su perfil de ciudadano antes de subir foto',
      );
    }

    const previousPath = cit.photoUrl
      ? this.userPhotoStorage.pathFromPublicUrl(cit.photoUrl)
      : undefined;
    const stored = await this.userPhotoStorage.upload(userId, file);
    cit.photoUrl = stored.publicUrl;
    const saved = await this.citizenRepository.save(cit);
    if (previousPath) {
      await this.userPhotoStorage.delete(previousPath);
    }
    return this.toResponse(saved);
  }

  async removePhotoForUser(userId: string): Promise<ResponseCitizenDto> {
    const cit = await this.citizenRepository.findOne({ where: { userId } });
    if (!cit) {
      throw new NotFoundException('Citizen profile not found for this user');
    }
    const previousPath = cit.photoUrl
      ? this.userPhotoStorage.pathFromPublicUrl(cit.photoUrl)
      : undefined;
    cit.photoUrl = undefined;
    const saved = await this.citizenRepository.save(cit);
    if (previousPath) {
      await this.userPhotoStorage.delete(previousPath);
    }
    return this.toResponse(saved);
  }

  private toResponse(citizen: Citizen): ResponseCitizenDto {
    const response = plainToInstance(ResponseCitizenDto, citizen, {
      excludeExtraneousValues: true,
    });
    response.addressId = citizen.address?.id;
    return response;
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
      items: items.map((item) => this.toResponse(item)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const cit = await this.citizenRepository.findOne({
      where: { id },
      relations: ['address'],
    });
    if (!cit) throw new NotFoundException(`Citizen ${id} not found`);
    return this.toResponse(cit);
  }

  async update(id: string, updateCitizenDto: UpdateCitizenDto) {
    this.assertSingleAddressInput(updateCitizenDto);
    await this.assertUniqueCitizenFields(
      {
        document: updateCitizenDto.document,
        email: updateCitizenDto.email,
      },
      id,
    );

    const saved = await this.dataSource.transaction(async (manager) => {
      const citizenRepository = manager.getRepository(Citizen);
      const addressRepository = manager.getRepository(Address);
      const cit = await citizenRepository.findOne({
        where: { id },
        relations: ['address'],
      });
      if (!cit) throw new NotFoundException(`Citizen ${id} not found`);

      if (updateCitizenDto.addressId) {
        const address = await addressRepository.findOne({
          where: { id: updateCitizenDto.addressId },
        });
        if (!address) throw new BadRequestException('Address not found');
        cit.address = address;
      } else if (updateCitizenDto.address) {
        if (!cit.address) {
          cit.address = await addressRepository.save(
            addressRepository.create(updateCitizenDto.address),
          );
        } else {
          const references = await citizenRepository.count({
            where: { address: { id: cit.address.id } },
          });
          if (references > 1) {
            cit.address = await addressRepository.save(
              addressRepository.create(updateCitizenDto.address),
            );
          } else {
            addressRepository.merge(cit.address, updateCitizenDto.address);
            cit.address = await addressRepository.save(cit.address);
          }
        }
      }

      if (updateCitizenDto.name !== undefined) {
        cit.name = updateCitizenDto.name;
      }
      if (updateCitizenDto.document !== undefined) {
        cit.document = updateCitizenDto.document;
      }
      if (updateCitizenDto.email !== undefined) {
        cit.email = updateCitizenDto.email;
      }
      if (updateCitizenDto.phone !== undefined) {
        cit.phone = updateCitizenDto.phone;
      }
      if (updateCitizenDto.birthDate !== undefined) {
        cit.birthDate = new Date(updateCitizenDto.birthDate);
      }

      return citizenRepository.save(cit);
    });
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const cit = await this.citizenRepository.findOne({ where: { id } });
    if (!cit) throw new NotFoundException(`Citizen ${id} not found`);
    await this.citizenRepository.delete(id);
    return;
  }
}
