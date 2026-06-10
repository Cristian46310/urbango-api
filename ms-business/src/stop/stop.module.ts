import { Module } from '@nestjs/common';
import { StopService } from './stop.service';
import { StopController } from './stop.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stop } from './entities/stop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stop])],
  controllers: [StopController],
  providers: [StopService],
  exports: [StopService],
})
export class StopModule {}
