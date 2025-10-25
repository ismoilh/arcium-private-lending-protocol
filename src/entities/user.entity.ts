import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LoanApplication } from './loan-application.entity';
import { LoanOffer } from './loan-offer.entity';
import { ActiveLoan } from './active-loan.entity';
import { UserWallet } from './user-wallet.entity';

export enum UserRole {
  BORROWER = 'borrower',
  LENDER = 'lender',
  ADMIN = 'admin',
  LIQUIDATOR = 'liquidator',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  REJECTED = 'rejected',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['walletAddress'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  walletAddress: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BORROWER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditScore: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalBorrowed: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalLent: number;

  @Column({ type: 'json', nullable: true })
  kycData: any;

  @Column({ type: 'json', nullable: true })
  preferences: any;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpires: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => LoanApplication, (application) => application.borrower)
  loanApplications: LoanApplication[];

  @OneToMany(() => LoanOffer, (offer) => offer.lender)
  loanOffers: LoanOffer[];

  @OneToMany(() => ActiveLoan, (loan) => loan.borrower)
  borrowedLoans: ActiveLoan[];

  @OneToMany(() => ActiveLoan, (loan) => loan.lender)
  lentLoans: ActiveLoan[];

  @OneToMany(() => UserWallet, (wallet) => wallet.user)
  wallets: UserWallet[];
}
