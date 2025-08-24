import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export enum EventType {
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  MEMORY_CREATED = 'memory_created',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  SUBSCRIPTION_CREATED = 'subscription_created',
  MEDIA_UPLOADED = 'media_uploaded',
  SYSTEM_ERROR = 'system_error'
}

export enum EventSource {
  WEB = 'web',
  MOBILE = 'mobile',
  API = 'api',
  SYSTEM = 'system'
}

@Entity('events')
@Index(['userId', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['source', 'createdAt'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EventType,
    nullable: false
  })
  type: EventType;

  @Column({
    type: 'enum',
    enum: EventSource,
    default: EventSource.API
  })
  source: EventSource;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  properties?: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value?: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'timestamp', nullable: true })
  eventTime?: Date;

  @Column({ default: false })
  isProcessed: boolean;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
