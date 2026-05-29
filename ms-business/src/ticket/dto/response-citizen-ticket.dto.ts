import { ApiProperty } from '@nestjs/swagger';
import { ResponseTicketDto } from './response-ticket.dto';

/** Boleto del ciudadano con datos para listar historial (HU-ENTR-2-005). */
export class ResponseCitizenTicketDto extends ResponseTicketDto {
  @ApiProperty({ example: 'Ruta Norte', required: false })
  routeName?: string;

  @ApiProperty({ format: 'uuid', required: false })
  routeId?: string;

  @ApiProperty({ example: 'ABC-123', required: false })
  busPlate?: string;

  @ApiProperty({
    example: 25,
    description: 'Minutos entre abordaje y fin del viaje',
    required: false,
  })
  totalTravelTimeMinutes?: number;

  @ApiProperty({
    format: 'uuid',
    required: false,
    description:
      'Id de un registro history del viaje (alternativa: GET /ticket/:id/trip-details)',
  })
  tripDetailHistoryId?: string;
}
