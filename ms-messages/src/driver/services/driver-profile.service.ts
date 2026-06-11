import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile } from '../entities/driver-profile.entity';

@Injectable()
export class DriverProfileService {
  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverRepository: Repository<DriverProfile>,
  ) {}

  async requireDriverProfile(userId: string): Promise<DriverProfile> {
    const driver = await this.driverRepository.findOne({
      where: { userId, type: 'driver' },
    });

    if (!driver) {
      throw new ForbiddenException(
        'Solo conductores registrados pueden enviar mensajes a grupos.',
      );
    }

    return driver;
  }
}
