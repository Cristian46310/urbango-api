import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CitizenProfile } from '../entities/citizen-profile.entity';

@Injectable()
export class CitizenProfileService {
  constructor(
    @InjectRepository(CitizenProfile)
    private readonly citizenRepository: Repository<CitizenProfile>,
  ) {}

  async requireCitizenProfile(userId: string): Promise<CitizenProfile> {
    const citizen = await this.citizenRepository.findOne({
      where: { userId, type: 'citizen' },
    });

    if (!citizen) {
      throw new ForbiddenException(
        'Solo ciudadanos registrados pueden crear o gestionar grupos.',
      );
    }

    return citizen;
  }
}
