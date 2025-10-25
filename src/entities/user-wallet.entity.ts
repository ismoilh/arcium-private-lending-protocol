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

export enum WalletType {
  SOLANA = 'solana',
  ETHEREUM = 'ethereum',
  BITCOIN = 'bitcoin',
}

export enum WalletStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('user_wallets')
@Index(['userId'])
@Index(['address'], { unique: true })
@Index(['type'])
export class UserWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ unique: true })
  address: string;

  @Column({
    type: 'enum',
    enum: WalletType,
    default: WalletType.SOLANA,
  })
  type: WalletType;

  @Column({
    type: 'enum',
    enum: WalletStatus,
    default: WalletStatus.ACTIVE,
  })
  status: WalletStatus;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 10, default: 'SOL' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  publicKey: string;

  @Column({ type: 'text', nullable: true })
  encryptedPrivateKey: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.wallets)
  @JoinColumn({ name: 'userId' })
  user: User;
}
