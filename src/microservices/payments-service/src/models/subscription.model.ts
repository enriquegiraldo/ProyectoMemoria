import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SubscriptionStatus, PaymentProvider, Currency } from '../types';

@Entity('subscriptions')
@Index(['userId'])
@Index(['status'])
@Index(['provider', 'providerSubscriptionId'])
@Index(['currentPeriodStart'])
@Index(['currentPeriodEnd'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  planId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerSubscriptionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerCustomerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: Currency;

  @Column({ type: 'varchar', length: 20 })
  interval: string; // monthly, yearly, etc.

  @Column({ type: 'int' })
  intervalCount: number;

  @Column({ type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  providerData: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason: string;

  @Column({ type: 'boolean', default: false })
  isTest: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  get isCanceled(): boolean {
    return this.status === SubscriptionStatus.CANCELED;
  }

  get isPastDue(): boolean {
    return this.status === SubscriptionStatus.PAST_DUE;
  }

  get isTrialing(): boolean {
    return this.trialEnd && this.trialEnd > new Date();
  }

  get daysUntilRenewal(): number {
    const now = new Date();
    const diffTime = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isExpired(): boolean {
    return this.currentPeriodEnd < new Date();
  }
}
