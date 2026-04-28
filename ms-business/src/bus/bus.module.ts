import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { Bus } from './entities/bus.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { Turn } from 'src/turn/entities/turn.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, Enterprise, Turn])],
  controllers: [BusController],
  providers: [BusService],
})
export class BusModule {}
