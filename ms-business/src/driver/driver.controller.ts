import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import type { JwtPayload } from '@/auth/types';

@ApiTags('Drivers')
@ApiBearerAuth('bearer')
@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @Authenticated()
  @ApiOperation({
    summary:
      'Registrar perfil de conductor (userId desde token, enterpriseId en body)',
  })
  create(
    @Body() createDriverDto: CreateDriverDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.driverService.create({
      ...createDriverDto,
      userId: currentUser.id,
    });
  }

  @Get('me')
  @Authenticated()
  @ApiOperation({
    summary: 'Obtener perfil de conductor del usuario autenticado',
  })
  findMe(@CurrentUser() currentUser: JwtPayload) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.driverService.findByUserId(currentUser.id);
  }

  @Get()
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.driverService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driverService.update(id, updateDriverDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverService.remove(id);
  }
}
