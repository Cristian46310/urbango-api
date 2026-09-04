import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserPhotoStorageService } from './user-photo-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [UserPhotoStorageService],
  exports: [UserPhotoStorageService],
})
export class UserPhotoModule {}
