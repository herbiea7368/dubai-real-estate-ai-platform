import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstallmentPlan, InstallmentFrequency, InstallmentPlanStatus, Installment } from '../entities/installment-plan.entity';

@Injectable()
export class InstallmentService {
  private readonly logger = new Logger(InstallmentService.name);

  constructor(
    @InjectRepository(InstallmentPlan)
    private installmentRepository: Repository<InstallmentPlan>,
  ) {}

  async createInstallmentPlan(
    propertyId: string,
    leadId: string,
    totalAmount: number,
    downPaymentAmount: number,
    installmentCount: number,
    frequency: InstallmentFrequency,
    startDate: Date,
  ): Promise<InstallmentPlan> {
    const remainingAmount = totalAmount - downPaymentAmount;
    const installmentAmount = Number((remainingAmount / installmentCount).toFixed(2));

    const installments = this.calculateInstallments(
      installmentAmount,
      installmentCount,
      frequency,
      startDate,
    );

    const endDate = installments[installments.length - 1].dueDate;

    const plan = this.installmentRepository.create({
      propertyId,
      leadId,
      totalAmount,
      downPaymentAmount,
      installmentCount,
      installmentAmount,
      frequency,
      startDate,
      endDate,
      status: InstallmentPlanStatus.ACTIVE,
      installments,
    });

    await this.installmentRepository.save(plan);
    this.logger.log(`Created installment plan for property ${propertyId} with ${installmentCount} ${frequency} installments`);

    return plan;
  }

  calculateInstallments(
    installmentAmount: number,
    count: number,
    frequency: InstallmentFrequency,
    startDate: Date,
  ): Installment[] {
    const installments: Installment[] = [];
    const monthsIncrement = this.getMonthsIncrement(frequency);

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + monthsIncrement * i);

      installments.push({
        number: i + 1,
        amount: installmentAmount,
        dueDate,
        status: 'pending',
      });
    }

    return installments;
  }

  private getMonthsIncrement(frequency: InstallmentFrequency): number {
    switch (frequency) {
      case InstallmentFrequency.MONTHLY:
        return 1;
      case InstallmentFrequency.QUARTERLY:
        return 3;
      case InstallmentFrequency.SEMI_ANNUAL:
        return 6;
      case InstallmentFrequency.ANNUAL:
        return 12;
      default:
        return 1;
    }
  }

  async recordInstallmentPayment(planId: string, installmentNumber: number, paymentId: string): Promise<InstallmentPlan> {
    const plan = await this.installmentRepository.findOne({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException(`Installment plan ${planId} not found`);
    }

    const installment = plan.installments.find((i) => i.number === installmentNumber);

    if (!installment) {
      throw new NotFoundException(`Installment #${installmentNumber} not found`);
    }

    installment.status = 'paid';
    installment.paidDate = new Date();
    installment.paymentId = paymentId;

    const allPaid = plan.installments.every((i) => i.status === 'paid');

    if (allPaid) {
      plan.status = InstallmentPlanStatus.COMPLETED;
      this.logger.log(`Installment plan ${planId} completed - all installments paid`);
    }

    await this.installmentRepository.save(plan);
    return plan;
  }

  async getUpcomingInstallments(leadId: string, daysAhead: number = 30): Promise<any[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const plans = await this.installmentRepository.find({
      where: {
        leadId,
        status: InstallmentPlanStatus.ACTIVE,
      },
    });

    const upcoming: any[] = [];

    for (const plan of plans) {
      for (const installment of plan.installments) {
        if (
          installment.status === 'pending' &&
          installment.dueDate >= today &&
          installment.dueDate <= futureDate
        ) {
          upcoming.push({
            planId: plan.id,
            propertyId: plan.propertyId,
            installmentNumber: installment.number,
            amount: installment.amount,
            dueDate: installment.dueDate,
            daysUntilDue: Math.ceil((installment.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
          });
        }
      }
    }

    return upcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  async handleMissedInstallment(planId: string, installmentNumber: number): Promise<InstallmentPlan> {
    const plan = await this.installmentRepository.findOne({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException(`Installment plan ${planId} not found`);
    }

    const installment = plan.installments.find((i) => i.number === installmentNumber);

    if (!installment) {
      throw new NotFoundException(`Installment #${installmentNumber} not found`);
    }

    if (installment.status === 'pending' && installment.dueDate < new Date()) {
      installment.status = 'overdue';

      // Calculate late fee (2% of installment amount)
      installment.lateFee = Number((installment.amount * 0.02).toFixed(2));

      await this.installmentRepository.save(plan);
      this.logger.warn(`Installment #${installmentNumber} of plan ${planId} is now overdue. Late fee: ${installment.lateFee} AED`);
    }

    return plan;
  }

  async findById(id: string): Promise<InstallmentPlan> {
    const plan = await this.installmentRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`Installment plan ${id} not found`);
    }

    return plan;
  }
}
