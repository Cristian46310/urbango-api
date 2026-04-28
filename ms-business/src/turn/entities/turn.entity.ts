import { Bus } from 'src/bus/entities/bus.entity';
import { Driver } from 'src/driver/entities/driver.entity';

export class Turn {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  bus: Bus;
  driver: Driver;
}
