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
import { Token } from './token.entity';

@Entity('token_balances')
@Index(['userId'])
@Index(['tokenId'])
@Index(['userId', 'tokenId'], { unique: true })
export class TokenBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  tokenId: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  lockedBalance: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  availableBalance: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  valueUSD: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Token, (token) => token.balances)
  @JoinColumn({ name: 'tokenId' })
  token: Token;
}
