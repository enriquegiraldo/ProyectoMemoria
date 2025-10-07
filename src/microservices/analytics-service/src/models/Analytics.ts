// src/microservices/analytics-service/src/models/Analytics.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram'
}

@Entity('metrics')
@Index(['name', 'timestamp'])
@Index(['type', 'timestamp'])
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({
    type: 'enum',
    enum: MetricType,
    nullable: false
  })
  type: MetricType;

  @Column({ type: 'timestamp', nullable: false })
  timestamp: Date;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: false })
  value: number;

  @Column({ type: 'jsonb', nullable: true })
  labels?: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('kpis')
@Index(['name', 'date'])
export class KPI {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: false })
  value: number;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true })
  target?: number;

  @Column({ type: 'jsonb', nullable: true })
  breakdown?: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
