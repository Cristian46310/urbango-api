import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdMapping } from './entities/user-id-mapping.entity';
import { UserIdMappingService } from './services/user-id-mapping.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserIdMapping])],
  providers: [UserIdMappingService],
  exports: [UserIdMappingService, TypeOrmModule],
})
export class SharedModule {}
