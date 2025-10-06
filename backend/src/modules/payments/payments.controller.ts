import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { EscrowService } from './services/escrow.service';
import { InstallmentService } from './services/installment.service';
import { PaymentTrackingService } from './services/payment-tracking.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { CreateEscrowDto } from './dto/create-escrow.dto';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentStatus } from './entities/payment.entity';

@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentGatewayService: PaymentGatewayService,
    private escrowService: EscrowService,
    private installmentService: InstallmentService,
    private paymentTrackingService: PaymentTrackingService,
  ) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async initiatePayment(@Request() req: any, @Body() initiatePaymentDto: InitiatePaymentDto) {
    // Create payment record
    const payment = await this.paymentTrackingService.createPayment({
      amount: initiatePaymentDto.amount,
      paymentType: initiatePaymentDto.paymentType,
      paymentMethod: initiatePaymentDto.paymentMethod,
      gateway: initiatePaymentDto.gateway,
      propertyId: initiatePaymentDto.propertyId,
      leadId: initiatePaymentDto.leadId || req.user.id,
      paidBy: req.user.id,
      currency: 'AED',
      processingFee: initiatePaymentDto.amount * 0.025, // 2.5% processing fee
    });

    // Process payment via gateway
    const paymentResult = await this.paymentGatewayService.processPayment({
      amount: initiatePaymentDto.amount,
      currency: 'AED',
      gateway: initiatePaymentDto.gateway,
      orderRef: payment.transactionId,
      returnUrl: initiatePaymentDto.returnUrl,
    });

    // Update payment status
    await this.paymentTrackingService.updatePaymentStatus(
      payment.id,
      paymentResult.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
      paymentResult.gatewayResponse,
    );

    return {
      paymentId: payment.id,
      transactionId: payment.transactionId,
      paymentUrl: paymentResult.paymentUrl,
      status: paymentResult.success ? 'success' : 'failed',
    };
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async paymentCallback(@Body() callbackData: any) {
    // In production, verify webhook signature here
    const { transactionId, status } = callbackData;

    const payment = await this.paymentTrackingService.findByTransactionId(transactionId);

    const newStatus = status === 'success' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

    await this.paymentTrackingService.updatePaymentStatus(payment.id, newStatus, callbackData);

    return { acknowledged: true };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Param('id') id: string) {
    return this.paymentTrackingService.findById(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('status') status?: PaymentStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.paymentTrackingService.getPaymentHistory({
      userId: req.user.id,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      status,
      limit: limit ? parseInt(limit) : 10,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  async refundPayment(@Param('id') id: string, @Body() refundDto: RefundPaymentDto) {
    const payment = await this.paymentTrackingService.findById(id);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    const refundResult = await this.paymentGatewayService.refundPayment(
      payment.gatewayTransactionId || payment.transactionId,
      refundDto.amount,
      refundDto.reason,
    );

    if (refundResult.success) {
      await this.paymentTrackingService.updatePaymentStatus(payment.id, PaymentStatus.REFUNDED, {
        refundId: refundResult.refundId,
        refundAmount: refundDto.amount,
        refundReason: refundDto.reason,
      });
    }

    return {
      success: refundResult.success,
      refundId: refundResult.refundId,
      amount: refundDto.amount,
    };
  }

  @Post('escrow/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.CREATED)
  async createEscrow(@Body() createEscrowDto: CreateEscrowDto) {
    return this.escrowService.createEscrowAccount(
      createEscrowDto.propertyId,
      createEscrowDto.buyerId,
      createEscrowDto.sellerId,
      createEscrowDto.agentId || null,
      createEscrowDto.totalAmount,
      createEscrowDto.bankName,
      createEscrowDto.bankAccountNumber,
      createEscrowDto.iban,
    );
  }

  @Post('escrow/:id/deposit')
  @UseGuards(JwtAuthGuard)
  async depositToEscrow(@Param('id') id: string, @Body() body: { paymentId: string }) {
    const payment = await this.paymentTrackingService.findById(body.paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment must be completed before depositing to escrow');
    }

    return this.escrowService.depositToEscrow(id, Number(payment.amount), payment.id);
  }

  @Post('escrow/:id/release-request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async requestEscrowRelease(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.escrowService.requestRelease(id, body.amount, req.user.id, body.reason);
  }

  @Post('escrow/:id/approve-release')
  @UseGuards(JwtAuthGuard)
  async approveEscrowRelease(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { requestId: string; approved: boolean },
  ) {
    return this.escrowService.approveRelease(id, body.requestId, req.user.id, body.approved);
  }

  @Post('installments/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @HttpCode(HttpStatus.CREATED)
  async createInstallmentPlan(@Body() createInstallmentDto: CreateInstallmentDto) {
    return this.installmentService.createInstallmentPlan(
      createInstallmentDto.propertyId,
      createInstallmentDto.leadId,
      createInstallmentDto.totalAmount,
      createInstallmentDto.downPaymentAmount,
      createInstallmentDto.installmentCount,
      createInstallmentDto.frequency,
      new Date(createInstallmentDto.startDate),
    );
  }

  @Get('installments/upcoming')
  @UseGuards(JwtAuthGuard)
  async getUpcomingInstallments(@Request() req: any, @Query('daysAhead') daysAhead?: string) {
    return this.installmentService.getUpcomingInstallments(
      req.user.id,
      daysAhead ? parseInt(daysAhead) : 30,
    );
  }

  @Post('installments/:id/pay')
  @UseGuards(JwtAuthGuard)
  async payInstallment(
    @Param('id') id: string,
    @Body() body: { installmentNumber: number; paymentId: string },
  ) {
    const payment = await this.paymentTrackingService.findById(body.paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment must be completed before recording installment payment');
    }

    return this.installmentService.recordInstallmentPayment(id, body.installmentNumber, payment.id);
  }
}
