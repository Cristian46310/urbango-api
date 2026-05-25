import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { JwtPayload } from '../types';

@Injectable()
export class ProfileContextService {
  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async requireCitizenId(user: JwtPayload): Promise<string> {
    const citizen = await this.citizenRepository.findOne({
      where: { userId: user.id },
    });
    if (!citizen) {
      throw new NotFoundException(
        'No tienes un perfil de ciudadano registrado. Completa el registro primero.',
      );
    }
    return citizen.id;
  }

  async requireDriverId(user: JwtPayload): Promise<string> {
    const driver = await this.driverRepository.findOne({
      where: { userId: user.id },
    });
    if (!driver) {
      throw new NotFoundException(
        'No tienes un perfil de conductor registrado. Completa el registro primero.',
      );
    }
    return driver.id;
  }
}
