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
import { PaymentMethodCitizenService } from './payment-method-citizen.service';
import { CreatePaymentMethodCitizenDto } from './dto/create-payment-method-citizen.dto';
import { UpdatePaymentMethodCitizenDto } from './dto/update-payment-method-citizen.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { RegisterPaymentMethodCitizenDto } from './dto/register-payment-method-citizen.dto';

@ApiTags('payment-method-citizen')
@Controller('payment-method-citizen')
export class PaymentMethodCitizenController {
  constructor(
    private readonly paymentMethodCitizenService: PaymentMethodCitizenService,
  ) {}

  @Get('me')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Listar métodos de pago del ciudadano autenticado (abordaje, recargas, etc.)',
  })
  findAllForMe(@CurrentUser() currentUser: JwtPayload) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.paymentMethodCitizenService.findAllForCitizenUser(
      currentUser.id,
    );
  }

  @Post('me')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Vincular método de pago al ciudadano autenticado (solo JWT, sin RBAC)',
  })
  createForMe(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: RegisterPaymentMethodCitizenDto,
  ) {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }
    return this.paymentMethodCitizenService.createForCitizenUser(
      currentUser.id,
      dto.paymentMethodId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Register payment method for citizen' })
  create(@Body() createPaymentMethodCitizenDto: CreatePaymentMethodCitizenDto) {
    return this.paymentMethodCitizenService.create(
      createPaymentMethodCitizenDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List payment methods assigned to citizens (paginated)',
  })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.paymentMethodCitizenService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentMethodCitizenService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentMethodCitizenDto: UpdatePaymentMethodCitizenDto,
  ) {
    return this.paymentMethodCitizenService.update(
      id,
      updatePaymentMethodCitizenDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentMethodCitizenService.remove(id);
  }
}
