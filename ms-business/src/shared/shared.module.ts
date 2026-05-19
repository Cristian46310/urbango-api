import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entitie';

@Module({
  imports: [TypeOrmModule.forFeature([Person])],
  exports: [TypeOrmModule],
})
export class SharedModule {}
