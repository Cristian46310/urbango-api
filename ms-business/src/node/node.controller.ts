import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { NodeService } from './node.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';

@Controller('node')
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  @Post('route/:routeId/stop/:stopId')
  async create(
    @Param('routeId') routeId: string,
    @Param('stopId') stopId: string,
    @Body() createNodeDto: CreateNodeDto,
  ) {
    return await this.nodeService.create(routeId, stopId, createNodeDto);
  }

  @Get()
  async findAll() {
    return await this.nodeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.nodeService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateNodeDto: UpdateNodeDto) {
    return await this.nodeService.update(id, updateNodeDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.nodeService.remove(id);
  }
}
