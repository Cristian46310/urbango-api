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
import { Roles } from '@/auth/decorators/roles.decorator';
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
      'Vincular método del catálogo al ciudadano (CASH, SYSTEM_CARD, EXTERNAL_CARD). Elige paymentMethodId de GET /payment-method',
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
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Registrar método de pago para un ciudadano (ADMIN)' })
  create(@Body() createPaymentMethodCitizenDto: CreatePaymentMethodCitizenDto) {
    return this.paymentMethodCitizenService.create(
      createPaymentMethodCitizenDto,
    );
  }

  @Get()
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Listar métodos de pago de ciudadanos (ADMIN). Propio: GET /payment-method-citizen/me',
  })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.paymentMethodCitizenService.findAll(pagination);
  }

  @Get(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Detalle payment-method-citizen (ADMIN)' })
  findOne(@Param('id') id: string) {
    return this.paymentMethodCitizenService.findOne(id);
  }

  @Put(':id')
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Actualizar payment-method-citizen (ADMIN)' })
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
  @Authenticated()
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Eliminar payment-method-citizen (ADMIN)' })
  remove(@Param('id') id: string) {
    return this.paymentMethodCitizenService.remove(id);
  }
}
