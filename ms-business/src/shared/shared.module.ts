import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdMapping } from './entities/user-id-mapping.entity';
import { UserIdMappingService } from './services/user-id-mapping.service';
import { PaginationService } from './services/pagination.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserIdMapping])],
  providers: [UserIdMappingService, PaginationService],
  exports: [UserIdMappingService, PaginationService, TypeOrmModule],
})
export class SharedModule {}
