import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StopService } from './stop.service';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';

@Controller('stop')
export class StopController {
  constructor(private readonly stopService: StopService) {}

  @Post()
  async create(@Body() createStopDto: CreateStopDto) {
    return await this.stopService.create(createStopDto);
  }

  @Get()
  async findAll() {
    return await this.stopService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.stopService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateStopDto: UpdateStopDto) {
    return await this.stopService.update(id, updateStopDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.stopService.remove(id);
  }
}
