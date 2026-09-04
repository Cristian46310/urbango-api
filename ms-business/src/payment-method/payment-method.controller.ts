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
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponsePaymentMethodDto } from './dto/response-payment-method.dto';
import { ResponsePaymentMethodListDto } from './dto/response-payment-method-list.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';

@ApiTags('payment-method')
@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Crear método de pago en catálogo (ADMIN). Preferir el seed: CASH, SYSTEM_CARD, EXTERNAL_CARD',
  })
  @ApiCreatedResponse({ type: ResponsePaymentMethodDto })
  create(@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(createPaymentMethodDto);
  }

  @Get('rechargeable')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Catálogo de métodos recargables (solo JWT, sin permiso RBAC)',
  })
  @ApiOkResponse({ type: [ResponsePaymentMethodDto] })
  findRechargeable(): Promise<ResponsePaymentMethodDto[]> {
    return this.paymentMethodService.findRechargeable();
  }

  @Get()
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Listar métodos de pago (paginado, JWT)' })
  @ApiOkResponse({ type: ResponsePaymentMethodListDto })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.paymentMethodService.findAll(pagination);
  }

  @Get(':id')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: ResponsePaymentMethodDto })
  @ApiNotFoundResponse({ description: 'Payment method not found' })
  findOne(@Param('id') id: string) {
    return this.paymentMethodService.findOne(id);
  }

  @Put(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Actualizar método de pago (ADMIN)' })
  update(
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(id, updatePaymentMethodDto);
  }

  @Delete(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Eliminar método de pago (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.paymentMethodService.remove(id);
  }
}
