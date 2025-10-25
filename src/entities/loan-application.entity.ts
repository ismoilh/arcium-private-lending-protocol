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
import { LoanOffer } from './loan-offer.entity';
import { ActiveLoan } from './active-loan.entity';

export enum LoanApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('loan_applications')
@Index(['borrowerId'])
@Index(['status'])
@Index(['createdAt'])
export class LoanApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  borrowerId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  interestRate: number;

  @Column({ type: 'int' })
  duration: number; // in days

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  collateralRatio: number;

  @Column({
    type: 'enum',
    enum: LoanApplicationStatus,
    default: LoanApplicationStatus.PENDING,
  })
  status: LoanApplicationStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  encryptedParams: any;

  @Column({ type: 'json', nullable: true })
  riskAssessment: any;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  riskScore: number;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.loanApplications)
  @JoinColumn({ name: 'borrowerId' })
  borrower: User;

  @OneToMany(() => LoanOffer, (offer) => offer.loanApplication)
  offers: LoanOffer[];

  @OneToMany(() => ActiveLoan, (loan) => loan.loanApplication)
  activeLoans: ActiveLoan[];
}
