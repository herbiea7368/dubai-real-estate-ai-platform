import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('consent_ledger')
@Index(['personId', 'consentType'])
@Index(['personId', 'grantedAt'])
export class ConsentLedger {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'person_id', type: 'uuid' })
  personId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'person_id' })
  person!: User;

  @Column({
    name: 'consent_type',
    type: 'varchar',
    length: 50,
  })
  consentType!: string;

  @Column({ type: 'boolean' })
  granted!: boolean;

  @Column({ type: 'varchar', length: 50 })
  version!: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ name: 'granted_at', type: 'timestamptz' })
  grantedAt!: Date;
}
