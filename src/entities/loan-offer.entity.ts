import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { LoanApplication } from './loan-application.entity';

export enum LoanOfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('loan_offers')
@Index(['lenderId'])
@Index(['loanApplicationId'])
@Index(['status'])
@Index(['expiresAt'])
export class LoanOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  lenderId: string;

  @Column('uuid')
  loanApplicationId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  offeredAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  offeredInterestRate: number;

  @Column({ type: 'text' })
  terms: string;

  @Column({
    type: 'enum',
    enum: LoanOfferStatus,
    default: LoanOfferStatus.PENDING,
  })
  status: LoanOfferStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'json', nullable: true })
  conditions: any;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.loanOffers)
  @JoinColumn({ name: 'lenderId' })
  lender: User;

  @ManyToOne(() => LoanApplication, (application) => application.offers)
  @JoinColumn({ name: 'loanApplicationId' })
  loanApplication: LoanApplication;
}
