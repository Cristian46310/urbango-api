import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AlightResponseDto {
    @ApiProperty()
    @Expose()
    message!: string;

    @ApiProperty()
    @Expose()
    ticketId!: string;

    @ApiProperty()
    @Expose()
    completedAt!: Date;

    @ApiProperty()
    @Expose()
    stopName!: string;

//indica si la silla quedo disponible para otro pasajero o no    
    @ApiProperty()
    @Expose()
    seatReleased!: boolean;

    @ApiProperty()
    @Expose()
    totalTravelTime!: number;
}