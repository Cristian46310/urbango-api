import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSupervisorDto } from './create-supervisor.dto';

export class UpdateSupervisorDto extends PartialType(
  OmitType(CreateSupervisorDto, ['enterpriseId'] as const),
) {}
