import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSupervisorDto } from './dto/create-supervisor.dto';
import { UpdateSupervisorDto } from './dto/update-supervisor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supervisor } from './entities/supervisor.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseSupervisorDto } from './dto/response-supervisor.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

export type CreateSupervisorInput = CreateSupervisorDto & { userId: string };

@Injectable()
export class SupervisorService {
  constructor(
    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
  ) {}

  private async assertUniqueSupervisorFields(
    fields: { document?: string; email?: string; userId?: string },
    excludeId?: string,
  ): Promise<void> {
    if (fields.userId) {
      const existingByUser = await this.supervisorRepository.findOne({
        where: { userId: fields.userId },
      });
      if (existingByUser && existingByUser.id !== excludeId) {
        throw new ConflictException(
          'Ya existe un perfil de supervisor para este usuario',
        );
      }
    }

    if (fields.document) {
      const existingByDocument = await this.supervisorRepository.findOne({
        where: { document: fields.document },
      });
      if (existingByDocument && existingByDocument.id !== excludeId) {
        throw new ConflictException(
          'Ya existe un supervisor con este documento',
        );
      }
    }

    if (fields.email) {
      const existingByEmail = await this.supervisorRepository.findOne({
        where: { email: fields.email },
      });
      if (existingByEmail && existingByEmail.id !== excludeId) {
        throw new ConflictException(
          'Ya existe un supervisor con este correo electrónico',
        );
      }
    }
  }

  async create(input: CreateSupervisorInput) {
    const ent = await this.enterpriseRepository.findOne({
      where: { id: input.enterpriseId },
    });
    if (!ent) {
      throw new BadRequestException('Enterprise not found');
    }

    await this.assertUniqueSupervisorFields({
      userId: input.userId,
      document: input.document,
      email: input.email,
    });

    const supData: Partial<Supervisor> = {
      name: input.name,
      document: input.document,
      email: input.email ?? '',
      phone: input.phone ?? '',
      userId: input.userId,
      enterprise: { id: input.enterpriseId } as Enterprise,
    };

    const sup = this.supervisorRepository.create(supData);
    const saved = await this.supervisorRepository.save(sup);
    return this.toResponse(saved);
  }

  async findByUserId(userId: string) {
    const sup = await this.supervisorRepository.findOne({
      where: { userId },
      relations: ['enterprise'],
    });
    if (!sup) {
      throw new NotFoundException('Supervisor profile not found for this user');
    }
    return this.toResponse(sup);
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
    const [items, totalItems] = await this.supervisorRepository.findAndCount({
      relations: ['enterprise'],
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
    const sup = await this.supervisorRepository.findOne({
      where: { id },
      relations: ['enterprise'],
    });
    if (!sup) throw new NotFoundException(`Supervisor ${id} not found`);
    return this.toResponse(sup);
  }

  async update(id: string, updateSupervisorDto: UpdateSupervisorDto) {
    await this.assertUniqueSupervisorFields(
      {
        document: updateSupervisorDto.document,
        email: updateSupervisorDto.email,
      },
      id,
    );

    const preload: Partial<Supervisor> = {
      id,
      ...(updateSupervisorDto as Partial<Supervisor>),
    };

    const sup = await this.supervisorRepository.preload(preload);
    if (!sup) throw new NotFoundException(`Supervisor ${id} not found`);
    const saved = await this.supervisorRepository.save(sup);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const sup = await this.supervisorRepository.findOne({ where: { id } });
    if (!sup) throw new NotFoundException(`Supervisor ${id} not found`);
    await this.supervisorRepository.delete(id);
    return;
  }

  private toResponse(supervisor: Supervisor): ResponseSupervisorDto {
    const dto = plainToInstance(ResponseSupervisorDto, supervisor, {
      excludeExtraneousValues: true,
    });
    dto.enterpriseId = supervisor.enterprise?.id;
    return dto;
  }
}
