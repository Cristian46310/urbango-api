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
} from '@nestjs/swagger';
import { ResponsePaymentMethodDto } from './dto/response-payment-method.dto';
import { ResponsePaymentMethodListDto } from './dto/response-payment-method-list.dto';

@ApiTags('payment-method')
@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment method' })
  @ApiCreatedResponse({ type: ResponsePaymentMethodDto })
  create(@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(createPaymentMethodDto);
  }

  @Get()
  @ApiOperation({ summary: 'List payment methods (paginated)' })
  @ApiOkResponse({ type: ResponsePaymentMethodListDto })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.paymentMethodService.findAll(pagination);
  }

  @Get(':id')
  @ApiOkResponse({ type: ResponsePaymentMethodDto })
  @ApiNotFoundResponse({ description: 'Payment method not found' })
  findOne(@Param('id') id: string) {
    return this.paymentMethodService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(id, updatePaymentMethodDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentMethodService.remove(id);
  }
}
