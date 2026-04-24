import { IsNotEmpty, IsString } from 'class-validator';

export class BaseStopDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsNotEmpty()
  location!: string;
}
