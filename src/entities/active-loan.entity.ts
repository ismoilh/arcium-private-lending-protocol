import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { LoanApplication } from './loan-application.entity';
import { LoanPayment } from './loan-payment.entity';

export enum ActiveLoanStatus {
  ACTIVE = 'active',
  REPAID = 'repaid',
  DEFAULTED = 'defaulted',
  LIQUIDATED = 'liquidated',
  CANCELLED = 'cancelled',
}

@Entity('active_loans')
@Index(['borrowerId'])
@Index(['lenderId'])
@Index(['status'])
@Index(['nextPaymentDate'])
export class ActiveLoan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loanApplicationId: string;

  @Column('uuid')
  borrowerId: string;

  @Column('uuid')
  lenderId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  principalAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  interestRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  remainingAmount: number;

  @Column({ type: 'timestamp' })
  nextPaymentDate: Date;

  @Column({ type: 'int' })
  totalPayments: number;

  @Column({ type: 'int', default: 0 })
  completedPayments: number;

  @Column({
    type: 'enum',
    enum: ActiveLoanStatus,
    default: ActiveLoanStatus.ACTIVE,
  })
  status: ActiveLoanStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  collateralValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  currentCollateralRatio: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPaymentDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  maturityDate: Date;

  @Column({ type: 'json', nullable: true })
  paymentSchedule: any;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => LoanApplication, (application) => application.activeLoans)
  @JoinColumn({ name: 'loanApplicationId' })
  loanApplication: LoanApplication;

  @ManyToOne(() => User, (user) => user.borrowedLoans)
  @JoinColumn({ name: 'borrowerId' })
  borrower: User;

  @ManyToOne(() => User, (user) => user.lentLoans)
  @JoinColumn({ name: 'lenderId' })
  lender: User;

  @OneToMany(() => LoanPayment, (payment) => payment.activeLoan)
  payments: LoanPayment[];
}
