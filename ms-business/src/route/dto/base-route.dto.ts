import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class BaseRouteDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsNotEmpty()
  description!: string;
  @IsNumber()
  @Min(1)
  price!: number;
}
