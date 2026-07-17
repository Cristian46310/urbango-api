import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BusService } from './bus.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ResponseBusDto } from './dto/response-bus.dto';
import { ResponseBusListDto } from './dto/response-bus-list.dto';
import { SecurityGuard } from '@/auth/guards/security.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';

@ApiTags('Buses')
@Controller('bus')
export class BusController {
  constructor(private readonly busService: BusService) {}

  private async resolveEnterpriseId(user: JwtPayload): Promise<string> {
    if (!user?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.busService.resolveEnterpriseIdForUser(user.id);
  }

  @Post()
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Registrar un bus en la flota de la empresa (requiere autenticación)',
  })
  @ApiCreatedResponse({ type: ResponseBusDto })
  async create(
    @Body() createBusDto: CreateBusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const enterpriseId = await this.resolveEnterpriseId(user);
    return this.busService.create(createBusDto, enterpriseId);
  }

  @Get('fleet')
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar buses de la flota de mi empresa (requiere autenticación)',
  })
  @ApiOkResponse({ type: ResponseBusListDto })
  async findFleet(
    @Query() paginationQuery: PaginationQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const enterpriseId = await this.resolveEnterpriseId(user);
    return this.busService.findAll(paginationQuery, enterpriseId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar buses' })
  @ApiOkResponse({ type: ResponseBusListDto })
  @ApiQuery({ name: 'enterpriseId', required: false })
  findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('enterpriseId') enterpriseId?: string,
  ) {
    return this.busService.findAll(paginationQuery, enterpriseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un bus por id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.busService.findOne(id);
  }

  @Put(':id')
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar un bus por id (requiere autenticación)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResponseBusDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusDto: UpdateBusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const enterpriseId = await this.resolveEnterpriseId(user);
    await this.busService.assertBusBelongsToEnterprise(id, enterpriseId);
    return this.busService.update(id, updateBusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SecurityGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un bus por id (requiere autenticación)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Bus eliminado' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    const enterpriseId = await this.resolveEnterpriseId(user);
    await this.busService.assertBusBelongsToEnterprise(id, enterpriseId);
    await this.busService.remove(id);
  }
}
