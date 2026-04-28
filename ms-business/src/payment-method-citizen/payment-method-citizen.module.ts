import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethodCitizenService } from './payment-method-citizen.service';
import { PaymentMethodCitizenController } from './payment-method-citizen.controller';
import { PaymentMethodCitizen } from './entities/payment-method-citizen.entity';
import { Citizen } from 'src/citizen/entities/citizen.entity';
import { PaymentMethod } from 'src/payment-method/entities/payment-method.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentMethodCitizen, Citizen, PaymentMethod]),
  ],
  controllers: [PaymentMethodCitizenController],
  providers: [PaymentMethodCitizenService],
})
export class PaymentMethodCitizenModule {}
