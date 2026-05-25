import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentCommentService } from './incident-comment.service';
import { IncidentCommentController } from './incident-comment.controller';
import { IncidentComment } from './entities/incident-comment.entity';
import { Incident } from '@/incident/entities/incident.entity';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([IncidentComment, Incident])],
  providers: [IncidentCommentService],
  controllers: [IncidentCommentController],
  exports: [IncidentCommentService, TypeOrmModule],
})
export class IncidentCommentModule {}
