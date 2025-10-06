import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ReportDefinition } from './report-definition.entity';
import { User } from '../../auth/entities/user.entity';

export enum ReportExecutionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('report_executions')
@Index(['reportDefinitionId'])
@Index(['executedBy'])
@Index(['status'])
@Index(['createdAt'])
@Index(['expiresAt'])
export class ReportExecution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  reportDefinitionId!: string;

  @ManyToOne(() => ReportDefinition)
  @JoinColumn({ name: 'reportDefinitionId' })
  reportDefinition!: ReportDefinition;

  @Column('uuid')
  executedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'executedBy' })
  executor!: User;

  @Column('jsonb')
  parameters!: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ReportExecutionStatus,
  })
  status!: ReportExecutionStatus;

  @Column('jsonb', { nullable: true })
  resultData!: any;

  @Column({ nullable: true })
  resultUrl!: string;

  @Column({ type: 'int', default: 0 })
  executionTimeMs!: number;

  @Column({ type: 'int', default: 0 })
  rowCount!: number;

  @Column('text', { nullable: true })
  errorMessage!: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
