export class ResponseTripDetailsDto {
  tripId!: string;
  route!: any;
  bus!: any;
  driver?: any;
  turn?: any;
  scheduler?: any;
  validations!: any[];
  totalTime!: { minutes: number; formatted: string };
  citizen!: { id: string; name: string; document?: string };
}
