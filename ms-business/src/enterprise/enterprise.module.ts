import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseService } from './enterprise.service';
import { EnterpriseController } from './enterprise.controller';
import { Enterprise } from './entities/enterprise.entity';
import { Bus } from '@/bus/entities/bus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Enterprise, Bus])],
  controllers: [EnterpriseController],
  providers: [EnterpriseService],
})
export class EnterpriseModule {}
