import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  TransactionInstruction,
} from '@solana/web3.js';
import { SolanaService } from '../solana/solana.service';
import {
  LendingService,
  LoanApplication,
  ActiveLoan,
} from '../lending/lending.service';

// MagicBlock SDK imports - using real implementations
import {
  createDelegateInstruction,
  delegationRecordPdaFromDelegatedAccount,
  delegationMetadataPdaFromDelegatedAccount,
  delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
} from '@magicblock-labs/ephemeral-rollups-sdk';
import {
  prepareMagicTransaction,
  sendMagicTransaction,
  getClosestValidator,
  getWritableAccounts,
  confirmMagicTransaction,
  getDelegationStatus,
} from 'magic-router-sdk';

export interface EphemeralRollupConfig {
  rpcUrl: string;
  validatorUrl: string;
  privateKey: string;
  programId: string;
}

export interface RealTimeTransaction {
  id: string;
  type: 'loan_approval' | 'payment' | 'liquidation' | 'offer_creation';
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  ephemeralRollupId?: string;
  transactionHash?: string;
}

export interface DelegationState {
  accountId: string;
  isDelegated: boolean;
  ephemeralRollupId?: string;
  delegatedAt?: Date;
}

@Injectable()
export class MagicBlockService {
  private readonly logger = new Logger(MagicBlockService.name);
  private connection: Connection;
  private realTimeTransactions: Map<string, RealTimeTransaction> = new Map();
  private delegationStates: Map<string, DelegationState> = new Map();

  constructor(
    private configService: ConfigService,
    private solanaService: SolanaService,
    private lendingService: LendingService
  ) {
    this.initializeMagicBlock();
  }

  /**
   * Initialize MagicBlock SDK and connection
   */
  private async initializeMagicBlock(): Promise<void> {
    try {
      const config: EphemeralRollupConfig = {
        rpcUrl:
          this.configService.get<string>('MAGICBLOCK_RPC_URL') ||
          'https://devnet-router.magicblock.app',
        validatorUrl:
          this.configService.get<string>('MAGICBLOCK_VALIDATOR_URL') ||
          'https://validator.magicblock.gg',
        privateKey:
          this.configService.get<string>('MAGICBLOCK_PRIVATE_KEY') || '',
        programId:
          this.configService.get<string>('MAGICBLOCK_PROGRAM_ID') ||
          '11111111111111111111111111111111',
      };

      this.connection = new Connection(config.rpcUrl, 'confirmed');

      this.logger.log('✅ MagicBlock SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MagicBlock SDK', error);
      throw new Error('MagicBlock initialization failed');
    }
  }

  /**
   * Delegate a lending account to an Ephemeral Rollup for real-time processing
   */
  async delegateAccountToEphemeralRollup(
    accountId: string,
    accountType: 'loan_application' | 'active_loan' | 'lending_pool'
  ): Promise<DelegationState> {
    try {
      this.logger.log(`Delegating account ${accountId} to Ephemeral Rollup`);

      // Get the closest validator for optimal performance
      const validatorKey = await getClosestValidator(this.connection);

      // Create the delegated account public key
      const delegatedAccount = new PublicKey(accountId);

      // Get the program ID for the lending protocol
      const programId = new PublicKey(
        this.configService.get<string>('SOLANA_PUBLIC_KEY') ||
          '11111111111111111111111111111111'
      );

      // Create delegation instruction using real MagicBlock SDK
      const delegationInstruction = createDelegateInstruction({
        payer: delegatedAccount, // Use the account as payer
        delegatedAccount,
        validator: validatorKey,
        ownerProgram: programId,
      });

      // Create transaction with delegation instruction
      const transaction = new Transaction().add(delegationInstruction);

      // Prepare the transaction with Magic Router
      const preparedTransaction = await prepareMagicTransaction(
        this.connection,
        transaction
      );

      // Get writable accounts for the transaction
      const writableAccounts = await getWritableAccounts(preparedTransaction);

      // Send the transaction using Magic Router
      const signature = await sendMagicTransaction(
        this.connection,
        preparedTransaction
      );

      // Confirm the transaction
      await confirmMagicTransaction(this.connection, signature);

      const delegationState: DelegationState = {
        accountId,
        isDelegated: true,
        ephemeralRollupId: validatorKey.toString(),
        delegatedAt: new Date(),
      };

      this.delegationStates.set(accountId, delegationState);
      this.logger.log(
        `✅ Account ${accountId} delegated to validator: ${validatorKey.toString()}`
      );
      this.logger.log(`Delegation signature: ${signature}`);

      return delegationState;
    } catch (error) {
      this.logger.error(`Failed to delegate account ${accountId}`, error);
      throw new Error('Account delegation failed');
    }
  }

  /**
   * Process real-time loan approval using Ephemeral Rollups
   */
  async processRealTimeLoanApproval(
    loanApplicationId: string,
    borrowerId: string,
    amount: number,
    interestRate: number,
    duration: number,
    collateralRatio: number
  ): Promise<RealTimeTransaction> {
    const transactionId = this.generateTransactionId();

    try {
      const realTimeTx: RealTimeTransaction = {
        id: transactionId,
        type: 'loan_approval',
        data: {
          loanApplicationId,
          borrowerId,
          amount,
          interestRate,
          duration,
          collateralRatio,
        },
        status: 'processing',
        timestamp: new Date(),
      };

      this.realTimeTransactions.set(transactionId, realTimeTx);

      this.logger.log(`Processing real-time loan approval: ${transactionId}`);

      // Delegate the loan application account to ER
      const delegationState = await this.delegateAccountToEphemeralRollup(
        loanApplicationId,
        'loan_application'
      );

      // Create loan approval transaction using real MagicBlock SDK
      const loanApprovalInstruction = new TransactionInstruction({
        programId: new PublicKey(
          this.configService.get<string>('SOLANA_PUBLIC_KEY') ||
            '11111111111111111111111111111111'
        ),
        keys: [
          {
            pubkey: new PublicKey(loanApplicationId),
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: new PublicKey(borrowerId),
            isSigner: true,
            isWritable: false,
          },
        ],
        data: Buffer.from(
          JSON.stringify({
            action: 'process_loan_approval',
            borrowerId,
            amount,
            interestRate,
            duration,
            collateralRatio,
          })
        ),
      });

      const transaction = new Transaction().add(loanApprovalInstruction);

      // Prepare the transaction with Magic Router for real-time processing
      const preparedTransaction = await prepareMagicTransaction(
        this.connection,
        transaction
      );

      // Get writable accounts
      const writableAccounts = await getWritableAccounts(preparedTransaction);

      // Send the transaction using Magic Router for real-time execution
      const signature = await sendMagicTransaction(
        this.connection,
        preparedTransaction
      );

      // Confirm the transaction
      await confirmMagicTransaction(this.connection, signature);

      // Update transaction status
      realTimeTx.status = 'completed';
      realTimeTx.ephemeralRollupId = delegationState.ephemeralRollupId;
      realTimeTx.transactionHash = signature;

      this.realTimeTransactions.set(transactionId, realTimeTx);

      // Process the loan application through the lending service
      await this.lendingService.submitLoanApplication({
        borrowerId,
        amount,
        interestRate,
        duration,
        collateralRatio,
      });

      this.logger.log(`✅ Real-time loan approval completed: ${transactionId}`);
      this.logger.log(`Transaction signature: ${signature}`);

      return realTimeTx;
    } catch (error) {
      this.logger.error('Real-time loan approval failed', error);

      const realTimeTx = this.realTimeTransactions.get(transactionId);
      if (realTimeTx) {
        realTimeTx.status = 'failed';
        this.realTimeTransactions.set(transactionId, realTimeTx);
      }

      throw new Error('Real-time loan approval failed');
    }
  }

  /**
   * Process real-time loan payment using Ephemeral Rollups
   */
  async processRealTimePayment(
    loanId: string,
    paymentAmount: number,
    borrowerSecretKey: string
  ): Promise<RealTimeTransaction> {
    const transactionId = this.generateTransactionId();

    try {
      const realTimeTx: RealTimeTransaction = {
        id: transactionId,
        type: 'payment',
        data: {
          loanId,
          paymentAmount,
        },
        status: 'processing',
        timestamp: new Date(),
      };

      this.realTimeTransactions.set(transactionId, realTimeTx);

      this.logger.log(`Processing real-time payment: ${transactionId}`);

      // Delegate the active loan account to ER
      const delegationState = await this.delegateAccountToEphemeralRollup(
        loanId,
        'active_loan'
      );

      // Create payment processing transaction using real MagicBlock SDK
      const paymentInstruction = new TransactionInstruction({
        programId: new PublicKey(
          this.configService.get<string>('SOLANA_PUBLIC_KEY') ||
            '11111111111111111111111111111111'
        ),
        keys: [
          { pubkey: new PublicKey(loanId), isSigner: false, isWritable: true },
        ],
        data: Buffer.from(
          JSON.stringify({
            action: 'process_payment',
            loanId,
            paymentAmount,
          })
        ),
      });

      const transaction = new Transaction().add(paymentInstruction);

      // Prepare the transaction with Magic Router for real-time processing
      const preparedTransaction = await prepareMagicTransaction(
        this.connection,
        transaction
      );

      // Get writable accounts
      const writableAccounts = await getWritableAccounts(preparedTransaction);

      // Send the transaction using Magic Router for real-time execution
      const signature = await sendMagicTransaction(
        this.connection,
        preparedTransaction
      );

      // Confirm the transaction
      await confirmMagicTransaction(this.connection, signature);

      // Update transaction status
      realTimeTx.status = 'completed';
      realTimeTx.ephemeralRollupId = delegationState.ephemeralRollupId;
      realTimeTx.transactionHash = signature;

      this.realTimeTransactions.set(transactionId, realTimeTx);

      // Process the payment through the lending service
      const borrowerKeypair =
        this.solanaService.createKeypairFromSecret(borrowerSecretKey);
      await this.lendingService.processLoanPayment(
        loanId,
        paymentAmount,
        borrowerSecretKey
      );

      this.logger.log(`✅ Real-time payment completed: ${transactionId}`);
      this.logger.log(`Transaction signature: ${signature}`);

      return realTimeTx;
    } catch (error) {
      this.logger.error('Real-time payment failed', error);

      const realTimeTx = this.realTimeTransactions.get(transactionId);
      if (realTimeTx) {
        realTimeTx.status = 'failed';
        this.realTimeTransactions.set(transactionId, realTimeTx);
      }

      throw new Error('Real-time payment failed');
    }
  }

  /**
   * Create real-time loan offer using Ephemeral Rollups
   */
  async createRealTimeLoanOffer(
    lenderId: string,
    loanApplicationId: string,
    offeredAmount: number,
    offeredInterestRate: number,
    terms: string
  ): Promise<RealTimeTransaction> {
    const transactionId = this.generateTransactionId();

    try {
      const realTimeTx: RealTimeTransaction = {
        id: transactionId,
        type: 'offer_creation',
        data: {
          lenderId,
          loanApplicationId,
          offeredAmount,
          offeredInterestRate,
          terms,
        },
        status: 'processing',
        timestamp: new Date(),
      };

      this.realTimeTransactions.set(transactionId, realTimeTx);

      this.logger.log(`Creating real-time loan offer: ${transactionId}`);

      // Delegate the loan application account to ER
      const delegationState = await this.delegateAccountToEphemeralRollup(
        loanApplicationId,
        'loan_application'
      );

      // Create loan offer transaction using real MagicBlock SDK
      const offerInstruction = new TransactionInstruction({
        programId: new PublicKey(
          this.configService.get<string>('SOLANA_PUBLIC_KEY') ||
            '11111111111111111111111111111111'
        ),
        keys: [
          {
            pubkey: new PublicKey(loanApplicationId),
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: new PublicKey(lenderId),
            isSigner: true,
            isWritable: false,
          },
        ],
        data: Buffer.from(
          JSON.stringify({
            action: 'create_loan_offer',
            lenderId,
            loanApplicationId,
            offeredAmount,
            offeredInterestRate,
            terms,
          })
        ),
      });

      const transaction = new Transaction().add(offerInstruction);

      // Prepare the transaction with Magic Router for real-time processing
      const preparedTransaction = await prepareMagicTransaction(
        this.connection,
        transaction
      );

      // Get writable accounts
      const writableAccounts = await getWritableAccounts(preparedTransaction);

      // Send the transaction using Magic Router for real-time execution
      const signature = await sendMagicTransaction(
        this.connection,
        preparedTransaction
      );

      // Confirm the transaction
      await confirmMagicTransaction(this.connection, signature);

      // Update transaction status
      realTimeTx.status = 'completed';
      realTimeTx.ephemeralRollupId = delegationState.ephemeralRollupId;
      realTimeTx.transactionHash = signature;

      this.realTimeTransactions.set(transactionId, realTimeTx);

      // Create the loan offer through the lending service
      await this.lendingService.createLoanOffer(
        lenderId,
        loanApplicationId,
        offeredAmount,
        offeredInterestRate,
        terms
      );

      this.logger.log(`✅ Real-time loan offer created: ${transactionId}`);
      this.logger.log(`Transaction signature: ${signature}`);

      return realTimeTx;
    } catch (error) {
      this.logger.error('Real-time loan offer creation failed', error);

      const realTimeTx = this.realTimeTransactions.get(transactionId);
      if (realTimeTx) {
        realTimeTx.status = 'failed';
        this.realTimeTransactions.set(transactionId, realTimeTx);
      }

      throw new Error('Real-time loan offer creation failed');
    }
  }

  /**
   * Get real-time transaction status
   */
  async getRealTimeTransactionStatus(
    transactionId: string
  ): Promise<RealTimeTransaction | null> {
    return this.realTimeTransactions.get(transactionId) || null;
  }

  /**
   * Get all real-time transactions
   */
  async getAllRealTimeTransactions(): Promise<RealTimeTransaction[]> {
    return Array.from(this.realTimeTransactions.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get delegation status for an account
   */
  async getDelegationStatus(
    accountId: string
  ): Promise<DelegationState | null> {
    return this.delegationStates.get(accountId) || null;
  }

  /**
   * Get Ephemeral Rollup statistics
   */
  async getEphemeralRollupStats(): Promise<{
    totalRealTimeTransactions: number;
    activeDelegations: number;
    averageProcessingTime: number;
    successRate: number;
  }> {
    const transactions = Array.from(this.realTimeTransactions.values());
    const delegations = Array.from(this.delegationStates.values());

    const totalRealTimeTransactions = transactions.length;
    const activeDelegations = delegations.filter((d) => d.isDelegated).length;
    const completedTransactions = transactions.filter(
      (t) => t.status === 'completed'
    );
    const successRate =
      totalRealTimeTransactions > 0
        ? (completedTransactions.length / totalRealTimeTransactions) * 100
        : 0;

    // Calculate average processing time (simplified)
    const processingTimes = completedTransactions.map((tx) => {
      // This would be calculated from actual processing times
      return 100; // Mock processing time in ms
    });
    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length
        : 0;

    return {
      totalRealTimeTransactions,
      activeDelegations,
      averageProcessingTime,
      successRate,
    };
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get MagicBlock network status
   */
  async getNetworkStatus(): Promise<{
    connected: boolean;
    ephemeralRollupsAvailable: number;
    averageLatency: number;
    version: string;
  }> {
    try {
      // This would check actual MagicBlock network status
      return {
        connected: true,
        ephemeralRollupsAvailable: 10, // Mock value
        averageLatency: 5, // Mock latency in ms
        version: '1.0.0',
      };
    } catch (error) {
      this.logger.error('Failed to get network status', error);
      return {
        connected: false,
        ephemeralRollupsAvailable: 0,
        averageLatency: 0,
        version: '1.0.0',
      };
    }
  }
}
