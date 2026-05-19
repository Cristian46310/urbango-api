import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CardRechargeController } from './card-recharge.controller';
import { CardRechargeService } from './card-recharge.service';
import { EpaycoService } from './epayco.service';
import { CardRechargeTransaction } from './entities/card-recharge-transaction.entity';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { PaymentMethod } from '@/payment-method/entities/payment-method.entity';
import { CitizenModule } from '@/citizen/citizen.module';
import { PaymentMethodCitizenModule } from '@/payment-method-citizen/payment-method-citizen.module';

@Module({
  imports: [
    HttpModule,
    CitizenModule,
    PaymentMethodCitizenModule,
    TypeOrmModule.forFeature([
      CardRechargeTransaction,
      PaymentMethodCitizen,
      PaymentMethod,
    ]),
  ],
  controllers: [CardRechargeController],
  providers: [CardRechargeService, EpaycoService],
  exports: [CardRechargeService],
})
export class CardRechargeModule {}
