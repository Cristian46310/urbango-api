import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BusPhoto } from './entities/bus-photo.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { BusPhotoService } from './bus-photo.service';
import { BusPhotoController } from './bus-photo.controller';
import { BusPhotoStorageService } from './bus-photo-storage.service';
import { BusModule } from '@/bus/bus.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([BusPhoto, Bus]), BusModule],
  controllers: [BusPhotoController],
  providers: [BusPhotoService, BusPhotoStorageService],
  exports: [BusPhotoService, TypeOrmModule],
})
export class BusPhotoModule {}
