import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../modules/auth/entities/user.entity';

@Entity('audit_logs')
@Index(['userId', 'timestamp'])
@Index(['action'])
@Index(['timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true })
  entityType!: string | null;

  @Column({ name: 'entity_id', type: 'integer', nullable: true })
  entityId!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  details?: any;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp!: Date;
}
