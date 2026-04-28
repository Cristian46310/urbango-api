import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnService } from './turn.service';
import { TurnController } from './turn.controller';
import { Turn } from './entities/turn.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Driver } from 'src/driver/entities/driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turn, Bus, Driver])],
  controllers: [TurnController],
  providers: [TurnService],
})
export class TurnModule {}
