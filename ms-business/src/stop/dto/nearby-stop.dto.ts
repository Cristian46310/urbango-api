import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NearbyRouteDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Route Name' })
  @Expose()
  name!: string;
}

export class NearbyStopDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Stop Name' })
  @Expose()
  name!: string;

  @ApiProperty({ example: 'Stop Location' })
  @Expose()
  location!: string;

  @ApiProperty({ example: 12.3456 })
  @Expose()
  latitude!: number;

  @ApiProperty({ example: 78.9012 })
  @Expose()
  longitude!: number;

  @ApiProperty({ example: 183.42, description: 'Distancia en metros' })
  @Expose()
  distanceMeters!: number;

  @ApiProperty({ type: [NearbyRouteDto] })
  @Expose()
  routes!: NearbyRouteDto[];
}