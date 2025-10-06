import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscrowAccount, EscrowStatus, EscrowCondition, ReleaseApproval } from '../entities/escrow-account.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    @InjectRepository(EscrowAccount)
    private escrowRepository: Repository<EscrowAccount>,
  ) {}

  async createEscrowAccount(
    propertyId: string,
    buyerId: string,
    sellerId: string,
    agentId: string | null,
    totalAmount: number,
    bankName: string,
    bankAccountNumber: string,
    iban?: string,
  ): Promise<EscrowAccount> {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const accountNumber = `ESC-${year}-${randomNum}`;

    const defaultConditions: EscrowCondition[] = [
      {
        id: uuidv4(),
        description: 'Title deed transfer completed',
        required: true,
        fulfilled: false,
      },
      {
        id: uuidv4(),
        description: 'NOC (No Objection Certificate) obtained',
        required: true,
        fulfilled: false,
      },
      {
        id: uuidv4(),
        description: 'Property handover completed',
        required: true,
        fulfilled: false,
      },
    ];

    const escrowAccount = this.escrowRepository.create({
      accountNumber,
      propertyId,
      buyerId,
      sellerId,
      agentId: agentId ?? undefined,
      totalAmount,
      depositedAmount: 0,
      releasedAmount: 0,
      status: EscrowStatus.ACTIVE,
      conditions: defaultConditions,
      releaseApprovals: [],
      bankName,
      bankAccountNumber,
      iban,
      openedAt: new Date(),
    });

    await this.escrowRepository.save(escrowAccount);
    this.logger.log(`Created escrow account ${accountNumber} for property ${propertyId}`);

    return escrowAccount;
  }

  async depositToEscrow(escrowAccountId: string, amount: number, _paymentId: string): Promise<EscrowAccount> {
    const escrowAccount = await this.escrowRepository.findOne({ where: { id: escrowAccountId } });

    if (!escrowAccount) {
      throw new NotFoundException(`Escrow account ${escrowAccountId} not found`);
    }

    escrowAccount.depositedAmount = Number(escrowAccount.depositedAmount) + amount;

    if (escrowAccount.depositedAmount >= escrowAccount.totalAmount) {
      escrowAccount.status = EscrowStatus.FUNDED;
      this.logger.log(`Escrow account ${escrowAccount.accountNumber} is now fully funded`);
    }

    await this.escrowRepository.save(escrowAccount);
    return escrowAccount;
  }

  async requestRelease(
    escrowAccountId: string,
    amount: number,
    requestedBy: string,
    reason: string,
  ): Promise<{ escrowAccount: EscrowAccount; requestId: string }> {
    const escrowAccount = await this.escrowRepository.findOne({ where: { id: escrowAccountId } });

    if (!escrowAccount) {
      throw new NotFoundException(`Escrow account ${escrowAccountId} not found`);
    }

    if (escrowAccount.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException('Escrow account must be funded before requesting release');
    }

    const requestId = uuidv4();
    const releaseRequest: ReleaseApproval = {
      requestId,
      amount,
      reason,
      requestedBy,
      requestedAt: new Date(),
      buyerApproved: false,
      sellerApproved: false,
      executed: false,
    };

    escrowAccount.releaseApprovals.push(releaseRequest);
    await this.escrowRepository.save(escrowAccount);

    this.logger.log(`Release request ${requestId} created for escrow ${escrowAccount.accountNumber}`);
    return { escrowAccount, requestId };
  }

  async approveRelease(
    escrowAccountId: string,
    requestId: string,
    approvedBy: string,
    approved: boolean,
  ): Promise<{ escrowAccount: EscrowAccount; allApproved: boolean }> {
    const escrowAccount = await this.escrowRepository.findOne({ where: { id: escrowAccountId } });

    if (!escrowAccount) {
      throw new NotFoundException(`Escrow account ${escrowAccountId} not found`);
    }

    const releaseRequest = escrowAccount.releaseApprovals.find((r) => r.requestId === requestId);

    if (!releaseRequest) {
      throw new NotFoundException(`Release request ${requestId} not found`);
    }

    if (approvedBy === escrowAccount.buyerId) {
      releaseRequest.buyerApproved = approved;
      releaseRequest.buyerApprovedAt = new Date();
    } else if (approvedBy === escrowAccount.sellerId) {
      releaseRequest.sellerApproved = approved;
      releaseRequest.sellerApprovedAt = new Date();
    }

    const allApproved = releaseRequest.buyerApproved && releaseRequest.sellerApproved;

    if (allApproved && !releaseRequest.executed) {
      await this.releaseEscrow(escrowAccountId, releaseRequest.amount, escrowAccount.sellerId);
      releaseRequest.executed = true;
      releaseRequest.executedAt = new Date();
      releaseRequest.recipient = escrowAccount.sellerId;
    }

    await this.escrowRepository.save(escrowAccount);
    return { escrowAccount, allApproved };
  }

  async releaseEscrow(escrowAccountId: string, amount: number, recipient: string): Promise<EscrowAccount> {
    const escrowAccount = await this.escrowRepository.findOne({ where: { id: escrowAccountId } });

    if (!escrowAccount) {
      throw new NotFoundException(`Escrow account ${escrowAccountId} not found`);
    }

    const availableAmount = Number(escrowAccount.depositedAmount) - Number(escrowAccount.releasedAmount);

    if (amount > availableAmount) {
      throw new BadRequestException(`Insufficient escrow balance. Available: ${availableAmount}, Requested: ${amount}`);
    }

    escrowAccount.releasedAmount = Number(escrowAccount.releasedAmount) + amount;

    if (escrowAccount.releasedAmount < escrowAccount.depositedAmount) {
      escrowAccount.status = EscrowStatus.PARTIAL_RELEASE;
    } else {
      escrowAccount.status = EscrowStatus.COMPLETED;
      escrowAccount.closedAt = new Date();
    }

    await this.escrowRepository.save(escrowAccount);
    this.logger.log(`Released ${amount} AED from escrow ${escrowAccount.accountNumber} to ${recipient}`);

    return escrowAccount;
  }

  async cancelEscrow(escrowAccountId: string, reason: string): Promise<EscrowAccount> {
    const escrowAccount = await this.escrowRepository.findOne({ where: { id: escrowAccountId } });

    if (!escrowAccount) {
      throw new NotFoundException(`Escrow account ${escrowAccountId} not found`);
    }

    if (escrowAccount.status === EscrowStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed escrow account');
    }

    escrowAccount.status = EscrowStatus.CANCELLED;
    escrowAccount.closedAt = new Date();

    await this.escrowRepository.save(escrowAccount);
    this.logger.log(`Cancelled escrow account ${escrowAccount.accountNumber}. Reason: ${reason}`);

    return escrowAccount;
  }

  async findById(id: string): Promise<EscrowAccount> {
    const escrowAccount = await this.escrowRepository.findOne({ where: { id } });

    if (!escrowAccount) {
      throw new NotFoundException(`Escrow account ${id} not found`);
    }

    return escrowAccount;
  }
}
