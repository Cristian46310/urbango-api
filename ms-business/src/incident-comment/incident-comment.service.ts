import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { IncidentComment } from './entities/incident-comment.entity';
import { Incident } from '@/incident/entities/incident.entity';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { ResponseIncidentCommentDto } from './dto/response-incident-comment.dto';
import { ResponseIncidentCommentListDto } from './dto/response-incident-comment-list.dto';
import { JwtPayload } from '@/auth/types';

@Injectable()
export class IncidentCommentService {
  constructor(
    @InjectRepository(IncidentComment)
    private readonly incidentCommentRepository: Repository<IncidentComment>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  private async findIncidentOrFail(incidentId: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with id ${incidentId} not found`);
    }

    return incident;
  }

  async addComment(
    incidentId: string,
    dto: CreateIncidentCommentDto,
    currentUser: JwtPayload,
  ): Promise<ResponseIncidentCommentDto> {
    await this.findIncidentOrFail(incidentId);

    const comment = await this.incidentCommentRepository.save(
      this.incidentCommentRepository.create({
        incident: { id: incidentId } as Incident,
        text: dto.text,
        authorUserId: currentUser.id,
        authorName: currentUser.name,
      }),
    );

    return plainToInstance(ResponseIncidentCommentDto, comment, {
      excludeExtraneousValues: true,
    });
  }

  async listComments(
    incidentId: string,
  ): Promise<ResponseIncidentCommentListDto> {
    await this.findIncidentOrFail(incidentId);

    const comments = await this.incidentCommentRepository.find({
      where: { incident: { id: incidentId } },
      order: { createdAt: 'ASC' },
    });

    return {
      items: plainToInstance(ResponseIncidentCommentDto, comments, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
