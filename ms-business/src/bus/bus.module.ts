import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios'; // Importante para HttpService
import { ConfigModule } from '@nestjs/config'; // Importante para ConfigService
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { BusStorageService } from './bus-storage.service';
import { Bus } from './entities/bus.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Driver } from '@/driver/entities/driver.entity';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([Bus, Enterprise, Turn, Driver]),
  ],
  controllers: [BusController],
  providers: [BusService, BusStorageService],
  exports: [BusService], 
})
export class BusModule {}