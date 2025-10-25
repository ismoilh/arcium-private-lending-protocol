import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ActiveLoan } from './active-loan.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  PRINCIPAL = 'principal',
  INTEREST = 'interest',
  PRINCIPAL_AND_INTEREST = 'principal_and_interest',
  EARLY_REPAYMENT = 'early_repayment',
  LATE_FEE = 'late_fee',
}

@Entity('loan_payments')
@Index(['activeLoanId'])
@Index(['status'])
@Index(['paymentDate'])
export class LoanPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  activeLoanId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  principalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  interestAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  lateFee: number;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.PRINCIPAL_AND_INTEREST,
  })
  paymentType: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'timestamp' })
  paymentDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionHash: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => ActiveLoan, (loan) => loan.payments)
  @JoinColumn({ name: 'activeLoanId' })
  activeLoan: ActiveLoan;
}
