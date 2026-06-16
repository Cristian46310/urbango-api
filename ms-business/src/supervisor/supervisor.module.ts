import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupervisorService } from './supervisor.service';
import { SupervisorController } from './supervisor.controller';
import { Supervisor } from './entities/supervisor.entity';
import { Person } from '@/shared/entities/person.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supervisor, Person, Enterprise])],
  controllers: [SupervisorController],
  providers: [SupervisorService],
  exports: [SupervisorService],
})
export class SupervisorModule {}
