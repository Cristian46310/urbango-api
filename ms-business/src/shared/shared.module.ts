import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdMapping } from './entities/user-id-mapping.entity';
import { Person } from './entities/person.entitie';

@Module({
  imports: [TypeOrmModule.forFeature([UserIdMapping, Person])],
  exports: [TypeOrmModule],
})
export class SharedModule {}
