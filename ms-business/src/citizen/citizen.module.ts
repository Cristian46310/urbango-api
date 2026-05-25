import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizenService } from './citizen.service';
import { CitizenController } from './citizen.controller';
import { Citizen } from './entities/citizen.entity';
import { Person } from '@/shared/entities/person.entity';
import { Address } from '@/address/entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Citizen, Person, Address])],
  controllers: [CitizenController],
  providers: [CitizenService],
  exports: [CitizenService],
})
export class CitizenModule {}
