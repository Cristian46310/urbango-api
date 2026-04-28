import { ApiProperty } from '@nestjs/swagger';
import { ResponseStopDto } from '@/stop/dto/response-stop.dto';

export class ResponseRouteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'Ruta Norte',
  })
  name!: string;

  @ApiProperty({
    example: 'Recorrido desde el terminal hasta el centro',
  })
  description!: string;

  @ApiProperty({
    example: 2500,
  })
  price!: number;

  @ApiProperty({ type: [ResponseStopDto] })
  stops!: ResponseStopDto[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}
