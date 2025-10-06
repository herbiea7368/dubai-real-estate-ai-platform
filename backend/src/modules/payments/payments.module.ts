import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { EscrowService } from './services/escrow.service';
import { InstallmentService } from './services/installment.service';
import { PaymentTrackingService } from './services/payment-tracking.service';
import { Payment } from './entities/payment.entity';
import { EscrowAccount } from './entities/escrow-account.entity';
import { InstallmentPlan } from './entities/installment-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, EscrowAccount, InstallmentPlan]),
    ConfigModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentGatewayService,
    EscrowService,
    InstallmentService,
    PaymentTrackingService,
  ],
  exports: [
    PaymentGatewayService,
    EscrowService,
    InstallmentService,
    PaymentTrackingService,
  ],
})
export class PaymentsModule {}
