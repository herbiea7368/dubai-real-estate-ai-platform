import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadScoringService } from './lead-scoring.service';
import { Lead } from './entities/lead.entity';
import { LeadActivity } from './entities/lead-activity.entity';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, LeadActivity, User])],
  controllers: [LeadsController],
  providers: [LeadsService, LeadScoringService],
  exports: [LeadsService, LeadScoringService],
})
export class LeadsModule {}
