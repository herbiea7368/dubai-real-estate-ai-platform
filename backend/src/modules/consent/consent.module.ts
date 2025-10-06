import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';
import { DsrController } from './dsr.controller';
import { ConsentLedger } from './entities/consent-ledger.entity';
import { User } from '../auth/entities/user.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditLogService } from '../../common/services/audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConsentLedger, User, AuditLog])],
  controllers: [ConsentController, DsrController],
  providers: [ConsentService, AuditLogService],
  exports: [ConsentService, AuditLogService],
})
export class ConsentModule {}
