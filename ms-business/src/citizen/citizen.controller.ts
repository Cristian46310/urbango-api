import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CitizenService } from './citizen.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@Controller('citizen')
export class CitizenController {
  constructor(private readonly citizenService: CitizenService) {}

  @Post()
  create(@Body() createCitizenDto: CreateCitizenDto) {
    return this.citizenService.create(createCitizenDto);
  }

  @Get()
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.citizenService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citizenService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCitizenDto: UpdateCitizenDto) {
    return this.citizenService.update(id, updateCitizenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citizenService.remove(id);
  }
}
