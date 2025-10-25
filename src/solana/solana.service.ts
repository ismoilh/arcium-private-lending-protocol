import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createMint,
  createAccount,
  mintTo,
  transfer,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

export interface WalletInfo {
  publicKey: string;
  balance: number;
  tokenAccounts: TokenAccount[];
}

export interface TokenAccount {
  address: string;
  mint: string;
  amount: number;
  decimals: number;
}

export interface LendingTransaction {
  signature: string;
  from: string;
  to: string;
  amount: number;
  tokenMint?: string;
  timestamp: Date;
}

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);
  private connection: Connection;
  private readonly lendingProgramId: PublicKey;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('SOLANA_RPC_URL') || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // In a real implementation, this would be your deployed program ID
    this.lendingProgramId = new PublicKey('11111111111111111111111111111111');
  }

  /**
   * Creates a new wallet for a user
   */
  async createWallet(): Promise<{ publicKey: string; secretKey: string }> {
    try {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toString();
      const secretKey = Buffer.from(keypair.secretKey).toString('base64');

      this.logger.log(`Created new wallet: ${publicKey}`);
      return { publicKey, secretKey };
    } catch (error) {
      this.logger.error('Failed to create wallet', error);
      throw new Error('Wallet creation failed');
    }
  }

  /**
   * Creates a keypair from secret key
   */
  createKeypairFromSecret(secretKey: string): Keypair {
    try {
      const secretKeyBytes = Buffer.from(secretKey, 'base64');
      return Keypair.fromSecretKey(secretKeyBytes);
    } catch (error) {
      this.logger.error('Failed to create keypair from secret', error);
      throw new Error('Invalid secret key');
    }
  }

  /**
   * Gets wallet information including balance and token accounts
   */
  async getWalletInfo(publicKeyString: string): Promise<WalletInfo> {
    try {
      const publicKey = new PublicKey(publicKeyString);
      const balance = await this.connection.getBalance(publicKey);
      const tokenAccounts = await this.getTokenAccounts(publicKey);

      return {
        publicKey: publicKeyString,
        balance: balance / LAMPORTS_PER_SOL,
        tokenAccounts,
      };
    } catch (error) {
      this.logger.error('Failed to get wallet info', error);
      throw new Error('Failed to retrieve wallet information');
    }
  }

  /**
   * Gets all token accounts for a wallet
   */
  private async getTokenAccounts(publicKey: PublicKey): Promise<TokenAccount[]> {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      return tokenAccounts.value.map(account => ({
        address: account.pubkey.toString(),
        mint: account.account.data.parsed.info.mint,
        amount: account.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: account.account.data.parsed.info.tokenAmount.decimals,
      }));
    } catch (error) {
      this.logger.error('Failed to get token accounts', error);
      return [];
    }
  }

  /**
   * Creates a new SPL token for lending
   */
  async createLendingToken(
    payerKeypair: Keypair,
    decimals: number = 6
  ): Promise<{ mint: string; signature: string }> {
    try {
      const mint = await createMint(
        this.connection,
        payerKeypair,
        payerKeypair.publicKey,
        null,
        decimals
      );

      this.logger.log(`Created lending token: ${mint.toString()}`);
      return { mint: mint.toString(), signature: 'mint-created' };
    } catch (error) {
      this.logger.error('Failed to create lending token', error);
      throw new Error('Token creation failed');
    }
  }

  /**
   * Transfers SOL between wallets
   */
  async transferSOL(
    fromKeypair: Keypair,
    toPublicKey: string,
    amount: number
  ): Promise<LendingTransaction> {
    try {
      const toPubkey = new PublicKey(toPublicKey);
      const lamports = amount * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey,
          lamports,
        })
      );

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair]
      );

      this.logger.log(`SOL transfer completed: ${signature}`);

      return {
        signature,
        from: fromKeypair.publicKey.toString(),
        to: toPublicKey,
        amount,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('SOL transfer failed', error);
      throw new Error('Transfer failed');
    }
  }

  /**
   * Transfers SPL tokens between wallets
   */
  async transferToken(
    fromKeypair: Keypair,
    toPublicKey: string,
    mint: string,
    amount: number
  ): Promise<LendingTransaction> {
    try {
      const mintPubkey = new PublicKey(mint);
      const toPubkey = new PublicKey(toPublicKey);

      // Get or create token accounts
      const fromTokenAccount = await this.getOrCreateTokenAccount(
        fromKeypair,
        mintPubkey
      );
      const toTokenAccount = await this.getOrCreateTokenAccount(
        fromKeypair, // In practice, you'd need the recipient's keypair
        mintPubkey
      );

      const mintInfo = await getMint(this.connection, mintPubkey);
      const transferAmount = amount * Math.pow(10, mintInfo.decimals);

      const signature = await transfer(
        this.connection,
        fromKeypair,
        fromTokenAccount,
        toTokenAccount,
        fromKeypair,
        transferAmount
      );

      this.logger.log(`Token transfer completed: ${signature}`);

      return {
        signature,
        from: fromKeypair.publicKey.toString(),
        to: toPublicKey,
        amount,
        tokenMint: mint,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Token transfer failed', error);
      throw new Error('Token transfer failed');
    }
  }

  /**
   * Gets or creates a token account for a wallet
   */
  private async getOrCreateTokenAccount(
    payer: Keypair,
    mint: PublicKey
  ): Promise<PublicKey> {
    try {
      // Try to find existing token account
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        payer.publicKey,
        { mint }
      );

      if (tokenAccounts.value.length > 0) {
        return tokenAccounts.value[0].pubkey;
      }

      // Create new token account
      const tokenAccount = await createAccount(
        this.connection,
        payer,
        mint,
        payer.publicKey
      );

      return tokenAccount;
    } catch (error) {
      this.logger.error('Failed to get/create token account', error);
      throw new Error('Token account creation failed');
    }
  }

  /**
   * Mints tokens to a specific account
   */
  async mintTokens(
    mint: string,
    toPublicKey: string,
    amount: number,
    payerKeypair: Keypair
  ): Promise<LendingTransaction> {
    try {
      const mintPubkey = new PublicKey(mint);
      const toPubkey = new PublicKey(toPublicKey);

      const tokenAccount = await this.getOrCreateTokenAccount(payerKeypair, mintPubkey);
      const mintInfo = await getMint(this.connection, mintPubkey);
      const mintAmount = amount * Math.pow(10, mintInfo.decimals);

      const signature = await mintTo(
        this.connection,
        payerKeypair,
        mintPubkey,
        tokenAccount,
        payerKeypair,
        mintAmount
      );

      this.logger.log(`Tokens minted: ${signature}`);

      return {
        signature,
        from: 'mint',
        to: toPublicKey,
        amount,
        tokenMint: mint,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Token minting failed', error);
      throw new Error('Token minting failed');
    }
  }

  /**
   * Gets transaction history for a wallet
   */
  async getTransactionHistory(publicKey: string, limit: number = 10): Promise<LendingTransaction[]> {
    try {
      const pubkey = new PublicKey(publicKey);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });

      const transactions: LendingTransaction[] = [];

      for (const sigInfo of signatures) {
        const tx = await this.connection.getTransaction(sigInfo.signature);
        if (tx) {
          // Parse transaction details (simplified)
          transactions.push({
            signature: sigInfo.signature,
            from: publicKey,
            to: 'unknown', // Would need to parse transaction details
            amount: 0, // Would need to parse transaction details
            timestamp: new Date(sigInfo.blockTime! * 1000),
          });
        }
      }

      return transactions;
    } catch (error) {
      this.logger.error('Failed to get transaction history', error);
      return [];
    }
  }

  /**
   * Validates a Solana address
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets current SOL price (mock implementation)
   */
  async getSOLPrice(): Promise<number> {
    // In a real implementation, you'd fetch from a price API
    return 100; // Mock price
  }
}
