import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDriverDto } from './create-driver.dto';

export class UpdateDriverDto extends PartialType(
  OmitType(CreateDriverDto, ['enterpriseId'] as const),
) {}
