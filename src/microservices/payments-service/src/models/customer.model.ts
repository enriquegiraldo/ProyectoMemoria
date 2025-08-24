import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentProvider } from '../types';

@Entity('customers')
@Index(['userId'])
@Index(['email'])
@Index(['provider', 'providerCustomerId'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerCustomerId: string;

  @Column({ type: 'jsonb', nullable: true })
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  providerData: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isTest: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  get fullAddress(): string {
    if (!this.address) return '';
    
    const parts = [
      this.address.line1,
      this.address.line2,
      this.address.city,
      this.address.state,
      this.address.postalCode,
      this.address.country
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}
