import { PartialType } from '@nestjs/swagger';
import { CreateGpsDto } from './create-gps.dto';

export class UpdateGpsDto extends PartialType(CreateGpsDto) {}
