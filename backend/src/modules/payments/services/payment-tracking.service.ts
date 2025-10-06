import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PaymentTrackingService {
  private readonly logger = new Logger(PaymentTrackingService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async createPayment(paymentData: Partial<Payment>): Promise<Payment> {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 100000000).toString().padStart(9, '0');
    const transactionId = `TXN-${year}-${randomNum}`;

    const payment = this.paymentRepository.create({
      ...paymentData,
      transactionId,
      status: PaymentStatus.PENDING,
      netAmount: Number(paymentData.amount) - Number(paymentData.processingFee || 0),
    });

    await this.paymentRepository.save(payment);
    this.logger.log(`Created payment ${transactionId} for ${payment.amount} ${payment.currency}`);

    return payment;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    gatewayResponse?: any,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    payment.status = status;

    if (gatewayResponse) {
      payment.gatewayResponse = gatewayResponse;
    }

    if (status === PaymentStatus.COMPLETED) {
      this.logger.log(`Payment ${payment.transactionId} completed successfully`);
    } else if (status === PaymentStatus.FAILED) {
      payment.failureReason = gatewayResponse?.error || 'Payment processing failed';
      this.logger.warn(`Payment ${payment.transactionId} failed: ${payment.failureReason}`);
    }

    await this.paymentRepository.save(payment);
    return payment;
  }

  async getPaymentHistory(filters: {
    userId?: string;
    propertyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    status?: PaymentStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: Payment[]; total: number }> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (filters.userId) {
      queryBuilder.andWhere('payment.paidBy = :userId', { userId: filters.userId });
    }

    if (filters.propertyId) {
      queryBuilder.andWhere('payment.propertyId = :propertyId', { propertyId: filters.propertyId });
    }

    if (filters.status) {
      queryBuilder.andWhere('payment.status = :status', { status: filters.status });
    }

    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    }

    queryBuilder.orderBy('payment.createdAt', 'DESC');

    if (filters.limit) {
      queryBuilder.take(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.skip(filters.offset);
    }

    const [payments, total] = await queryBuilder.getManyAndCount();

    return { payments, total };
  }

  async generateReceipt(paymentId: string): Promise<string> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['property', 'payer'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Can only generate receipts for completed payments');
    }

    // MVP: Generate mock receipt URL
    // Production: Use PDF generation library (e.g., PDFKit, Puppeteer)
    const receiptUrl = `https://storage.example.com/receipts/${payment.transactionId}.pdf`;

    payment.receiptUrl = receiptUrl;
    await this.paymentRepository.save(payment);

    this.logger.log(`Generated receipt for payment ${payment.transactionId}`);
    return receiptUrl;
  }

  async reconcilePayments(dateFrom: Date, dateTo: Date): Promise<{
    totalPayments: number;
    completedPayments: number;
    totalAmount: number;
    discrepancies: any[];
  }> {
    const payments = await this.paymentRepository.find({
      where: {
        createdAt: Between(dateFrom, dateTo),
      },
    });

    const completedPayments = payments.filter((p) => p.status === PaymentStatus.COMPLETED);

    const totalAmount = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // MVP: Simple reconciliation
    // Production: Compare with gateway settlement reports
    const discrepancies: any[] = [];

    this.logger.log(`Reconciled ${payments.length} payments from ${dateFrom.toISOString()} to ${dateTo.toISOString()}`);

    return {
      totalPayments: payments.length,
      completedPayments: completedPayments.length,
      totalAmount,
      discrepancies,
    };
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['property', 'lead', 'payer', 'receiver', 'escrowAccount'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    return payment;
  }

  async findByTransactionId(transactionId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId },
      relations: ['property', 'lead', 'payer', 'receiver', 'escrowAccount'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with transaction ID ${transactionId} not found`);
    }

    return payment;
  }
}
