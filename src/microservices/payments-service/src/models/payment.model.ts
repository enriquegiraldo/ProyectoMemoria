import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { PaymentStatus, PaymentMethod, PaymentProvider, Currency } from '../types';

@Entity('payments')
@Index(['userId'])
@Index(['provider', 'providerPaymentId'])
@Index(['status'])
@Index(['createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @Column({ type: 'uuid', nullable: true })
  subscriptionId: string;

  @Column({ type: 'uuid', nullable: true })
  invoiceId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: Currency;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerPaymentId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerCustomerId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerPaymentMethodId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  providerData: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failureReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failureCode: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ type: 'boolean', default: false })
  isTest: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isSuccessful(): boolean {
    return this.status === PaymentStatus.SUCCEEDED;
  }

  get isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  get isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  get isRefunded(): boolean {
    return this.refundedAmount > 0;
  }

  get refundableAmount(): number {
    return this.amount - this.refundedAmount;
  }
}
