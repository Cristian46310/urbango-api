import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Stop } from './entities/stop.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StopService {
  constructor(
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}
  async create(createStopDto: CreateStopDto) {
    const stop = this.stopRepository.create(createStopDto);
    return await this.stopRepository.save(stop);
  }

  async findAll() {
    return await this.stopRepository.find();
  }

  async findOne(id: string) {
    const stop = await this.stopRepository.findOne({ where: { id } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    return stop;
  }

  async update(id: string, updateStopDto: UpdateStopDto) {
    const stop = await this.stopRepository.findOne({ where: { id } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    return await this.stopRepository.update(id, updateStopDto);
  }

  async remove(id: string) {
    const stop = await this.stopRepository.findOne({ where: { id } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    return await this.stopRepository.delete(id);
  }
}
