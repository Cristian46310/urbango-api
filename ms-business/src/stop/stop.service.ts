import { Injectable } from '@nestjs/common';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';

@Injectable()
export class StopService {
  create(createStopDto: CreateStopDto) {
    return 'This action adds a new stop';
  }

  findAll() {
    return `This action returns all stop`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stop`;
  }

  update(id: number, updateStopDto: UpdateStopDto) {
    return `This action updates a #${id} stop`;
  }

  remove(id: number) {
    return `This action removes a #${id} stop`;
  }
}
