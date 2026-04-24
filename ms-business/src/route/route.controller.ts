import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RouteService } from './route.service';
import { UpdateRouteDto } from './dto/update-route.dto';
import { CreateRouteNodesDto } from './dto/create-route-nodes.dto';

@Controller('route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  async create(@Body() createRouteDto: CreateRouteNodesDto) {
    return await this.routeService.create(createRouteDto);
  }

  @Get()
  async findAll() {
    return await this.routeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.routeService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return await this.routeService.update(id, updateRouteDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.routeService.remove(id);
  }
}
