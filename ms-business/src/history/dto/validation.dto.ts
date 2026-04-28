import { ApiProperty } from '@nestjs/swagger';
import { ResponseStopDto } from '@/stop/dto/response-stop.dto';

export class ValidationDto {
  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ type: () => ResponseStopDto, required: false })
  stop?: ResponseStopDto | null;

  @ApiProperty()
  validatedAt!: Date;

  @ApiProperty({ example: 'boarding' })
  type!: string;
}
