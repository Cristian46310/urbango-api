import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Stop } from './entities/stop.entity';
import { Repository } from 'typeorm';
import { ResponseStopDto } from './dto/response-stop.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class StopService {
  constructor(
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}
  async create(createStopDto: CreateStopDto): Promise<ResponseStopDto> {
    const stop = this.stopRepository.create(createStopDto);
    return plainToInstance(ResponseStopDto, await this.stopRepository.save(stop));
  }

  async findAll(): Promise<ResponseStopDto[]> {
    return plainToInstance(ResponseStopDto, await this.stopRepository.find());
  }

  async findOne(id: string): Promise<ResponseStopDto> {
    const stop = await this.stopRepository.findOne({ where: { id } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    return plainToInstance(ResponseStopDto, stop);
  }

  async update(
    id: string,
    updateStopDto: UpdateStopDto,
  ): Promise<ResponseStopDto> {
    const stop = await this.stopRepository.preload({id, ...updateStopDto});
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    const updatedStop = await this.stopRepository.save(stop);
    return plainToInstance(ResponseStopDto, updatedStop);
  }

  async remove(id: string): Promise<void> {
    const stop = await this.stopRepository.findOne({ where: { id } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    await this.stopRepository.delete(id);
    return;
  }
}
