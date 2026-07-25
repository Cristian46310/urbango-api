import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponseAddressDto } from './dto/response-address.dto';
import { ResponseAddressListDto } from './dto/response-address-list.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';

@ApiTags('address')
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Crear dirección (solo JWT, sin RBAC — onboarding ciudadano/conductor)',
  })
  @ApiCreatedResponse({ type: ResponseAddressDto })
  create(@Body() createAddressDto: CreateAddressDto) {
    return this.addressService.create(createAddressDto);
  }

  @Get()
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Listar direcciones paginado (solo ADMIN)' })
  @ApiOkResponse({ type: ResponseAddressListDto })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.addressService.findAll(pagination);
  }

  @Get(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Detalle de dirección por id (solo ADMIN)' })
  @ApiOkResponse({ type: ResponseAddressDto })
  @ApiNotFoundResponse({ description: 'Address not found' })
  findOne(@Param('id') id: string) {
    return this.addressService.findOne(id);
  }

  @Put(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Actualizar dirección (solo ADMIN)' })
  update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressService.update(id, updateAddressDto);
  }

  @Delete(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Eliminar dirección (solo ADMIN)' })
  remove(@Param('id') id: string) {
    return this.addressService.remove(id);
  }
}
