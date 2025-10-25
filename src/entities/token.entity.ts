import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TokenBalance } from './token-balance.entity';

export enum TokenType {
  NATIVE = 'native',
  SPL = 'spl',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
}

export enum TokenStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('tokens')
@Index(['symbol'])
@Index(['contractAddress'], { unique: true })
@Index(['type'])
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column({ type: 'int', default: 6 })
  decimals: number;

  @Column({ unique: true, nullable: true })
  contractAddress: string;

  @Column({
    type: 'enum',
    enum: TokenType,
    default: TokenType.SPL,
  })
  type: TokenType;

  @Column({
    type: 'enum',
    enum: TokenStatus,
    default: TokenStatus.ACTIVE,
  })
  status: TokenStatus;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  priceUSD: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  marketCap: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  totalSupply: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  circulatingSupply: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => TokenBalance, (balance) => balance.token)
  balances: TokenBalance[];
}
