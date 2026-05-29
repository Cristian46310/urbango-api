import { ApiProperty } from '@nestjs/swagger';
import { ResponseStopDto } from '@/stop/dto/response-stop.dto';

export class ResponseRouteNodeDto {
  @ApiProperty({
    example: '64b345ef-b653-47d7-96c7-c22f1ff58b17',
    description: 'ID del nodo (usar en POST /boarding como nodeId)',
  })
  id!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: 5 })
  estimatedTimeMinutes!: number;

  @ApiProperty({ type: () => ResponseStopDto })
  stop!: ResponseStopDto;
}

export class ResponseRouteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'RUT-001',
  })
  code!: string;

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

  @ApiProperty({ type: [ResponseRouteNodeDto] })
  nodes!: ResponseRouteNodeDto[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}
