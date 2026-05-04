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
import { PaymentMethodCitizenService } from './payment-method-citizen.service';
import { CreatePaymentMethodCitizenDto } from './dto/create-payment-method-citizen.dto';
import { UpdatePaymentMethodCitizenDto } from './dto/update-payment-method-citizen.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('payment-method-citizen')
@Controller('payment-method-citizen')
export class PaymentMethodCitizenController {
  constructor(
    private readonly paymentMethodCitizenService: PaymentMethodCitizenService,
  ) {}

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

  @Patch(':id')
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
