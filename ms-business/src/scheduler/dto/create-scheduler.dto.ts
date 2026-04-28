import { IsUUID, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateSchedulerDto {
  @IsUUID()
  @IsNotEmpty()
  busId: string;

  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}
