import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBusDto } from './create-bus.dto';

export class UpdateBusDto extends PartialType(
  OmitType(CreateBusDto, ['plate'] as const),
) {}
