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
  @ApiOperation({ summary: 'List addresses (paginated)' })
  @ApiOkResponse({ type: ResponseAddressListDto })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.addressService.findAll(pagination);
  }

  @Get(':id')
  @ApiOkResponse({ type: ResponseAddressDto })
  @ApiNotFoundResponse({ description: 'Address not found' })
  findOne(@Param('id') id: string) {
    return this.addressService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressService.update(id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.addressService.remove(id);
  }
}
