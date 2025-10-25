import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  prepareMagicTransaction,
  sendMagicTransaction,
  getClosestValidator,
  getWritableAccounts,
  confirmMagicTransaction,
} from 'magic-router-sdk';

export interface TransactionMetadata {
  type: 'lending' | 'payment' | 'governance' | 'risk_assessment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresEncryption: boolean;
  estimatedGas: number;
  maxLatency?: number; // Maximum acceptable latency in ms
  privacyLevel?: 'public' | 'private' | 'confidential';
}

export interface RoutingDecision {
  shouldUseEphemeralRollup: boolean;
  ephemeralRollupId?: string;
  reason: string;
  estimatedLatency: number;
  estimatedCost: number;
}

export interface RoutedTransaction {
  transaction: Transaction;
  routingDecision: RoutingDecision;
  metadata: TransactionMetadata;
}

@Injectable()
export class MagicRouterService {
  private readonly logger = new Logger(MagicRouterService.name);
  private connection: Connection;

  constructor(private configService: ConfigService) {
    this.initializeMagicRouter();
  }

  /**
   * Initialize Magic Router with configuration
   */
  private async initializeMagicRouter(): Promise<void> {
    try {
      const rpcUrl =
        this.configService.get<string>('MAGICBLOCK_RPC_URL') ||
        'https://devnet-router.magicblock.app';
      const programId =
        this.configService.get<string>('MAGICBLOCK_PROGRAM_ID') ||
        '11111111111111111111111111111111';

      this.connection = new Connection(rpcUrl, 'confirmed');

      this.logger.log('✅ Magic Router initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Magic Router', error);
      throw new Error('Magic Router initialization failed');
    }
  }

  /**
   * Route a transaction based on metadata and requirements
   */
  async routeTransaction(
    transaction: Transaction,
    metadata: TransactionMetadata
  ): Promise<RoutedTransaction> {
    try {
      this.logger.log(
        `Routing transaction with type: ${metadata.type}, priority: ${metadata.priority}`
      );

      // Analyze transaction to determine routing decision
      const routingDecision = await this.analyzeTransaction(
        transaction,
        metadata
      );

      // Apply routing decision using real MagicBlock SDK
      if (routingDecision.shouldUseEphemeralRollup) {
        // Prepare transaction for Ephemeral Rollup using Magic Router
        transaction = await prepareMagicTransaction(
          this.connection,
          transaction
        );
      }

      const routedTransaction: RoutedTransaction = {
        transaction,
        routingDecision,
        metadata,
      };

      this.logger.log(
        `Transaction routed: ${routingDecision.shouldUseEphemeralRollup ? 'Ephemeral Rollup' : 'Solana Mainnet'}`
      );

      return routedTransaction;
    } catch (error) {
      this.logger.error('Transaction routing failed', error);
      throw new Error('Transaction routing failed');
    }
  }

  /**
   * Analyze transaction to determine optimal routing
   */
  private async analyzeTransaction(
    transaction: Transaction,
    metadata: TransactionMetadata
  ): Promise<RoutingDecision> {
    const reasons: string[] = [];
    let shouldUseEphemeralRollup = false;
    let ephemeralRollupId: string | undefined;
    let estimatedLatency = 400; // Default Solana latency
    let estimatedCost = 0.000005; // Default Solana cost

    // Check if transaction requires real-time processing
    if (metadata.priority === 'high' || metadata.priority === 'critical') {
      shouldUseEphemeralRollup = true;
      reasons.push('High priority transaction requires real-time processing');
      estimatedLatency = 10; // Ephemeral Rollup latency
      estimatedCost = 0; // Gasless on ER
    }

    // Check if transaction requires privacy
    if (
      metadata.privacyLevel === 'private' ||
      metadata.privacyLevel === 'confidential'
    ) {
      shouldUseEphemeralRollup = true;
      reasons.push('Privacy requirements mandate Ephemeral Rollup');
    }

    // Check if transaction requires encryption
    if (metadata.requiresEncryption) {
      shouldUseEphemeralRollup = true;
      reasons.push('Encrypted processing required');
    }

    // Check latency requirements
    if (metadata.maxLatency && metadata.maxLatency < 100) {
      shouldUseEphemeralRollup = true;
      reasons.push('Low latency requirement');
    }

    // Check transaction complexity (more instructions = better for ER)
    if (transaction.instructions.length > 5) {
      shouldUseEphemeralRollup = true;
      reasons.push('Complex transaction benefits from ER processing');
    }

    // Check if it's a lending-specific transaction
    if (metadata.type === 'lending' || metadata.type === 'payment') {
      shouldUseEphemeralRollup = true;
      reasons.push('Lending transactions benefit from real-time processing');
    }

    // Generate ephemeral rollup ID if needed
    if (shouldUseEphemeralRollup) {
      ephemeralRollupId = await this.getOptimalEphemeralRollup(metadata);
    }

    return {
      shouldUseEphemeralRollup,
      ephemeralRollupId,
      reason: reasons.join('; '),
      estimatedLatency,
      estimatedCost,
    };
  }

  /**
   * Get optimal Ephemeral Rollup for the transaction
   */
  private async getOptimalEphemeralRollup(
    metadata: TransactionMetadata
  ): Promise<string> {
    try {
      // Use real MagicBlock SDK to get the closest validator
      const validatorKey = await getClosestValidator(this.connection);

      this.logger.log(
        `Selected Ephemeral Rollup validator: ${validatorKey.toString()}`
      );

      return validatorKey.toString();
    } catch (error) {
      this.logger.error('Failed to get optimal Ephemeral Rollup', error);
      throw new Error('Ephemeral Rollup selection failed');
    }
  }

  /**
   * Prepare transaction for Ephemeral Rollup execution
   */
  private async prepareForEphemeralRollup(
    transaction: Transaction,
    ephemeralRollupId: string
  ): Promise<Transaction> {
    try {
      // Add Ephemeral Rollup metadata to transaction
      const erInstruction = new TransactionInstruction({
        programId: new PublicKey(
          this.configService.get<string>('MAGICBLOCK_PROGRAM_ID') ||
            '11111111111111111111111111111111'
        ),
        keys: [],
        data: Buffer.from(
          JSON.stringify({
            ephemeralRollupId,
            routing: 'magicblock',
            timestamp: Date.now(),
          })
        ),
      });

      transaction.add(erInstruction);

      this.logger.log(
        `Transaction prepared for Ephemeral Rollup: ${ephemeralRollupId}`
      );

      return transaction;
    } catch (error) {
      this.logger.error(
        'Failed to prepare transaction for Ephemeral Rollup',
        error
      );
      throw new Error('Ephemeral Rollup preparation failed');
    }
  }

  /**
   * Send routed transaction
   */
  async sendRoutedTransaction(routedTransaction: RoutedTransaction): Promise<{
    signature: string;
    routingDecision: RoutingDecision;
    executionTime: number;
  }> {
    try {
      const startTime = Date.now();

      let signature: string;

      if (routedTransaction.routingDecision.shouldUseEphemeralRollup) {
        // Send to Ephemeral Rollup via Magic Router using real SDK
        const writableAccounts = await getWritableAccounts(
          routedTransaction.transaction
        );
        signature = await sendMagicTransaction(
          this.connection,
          routedTransaction.transaction
        );

        // Confirm the transaction
        await confirmMagicTransaction(this.connection, signature);
      } else {
        // Send to Solana mainnet
        signature = await this.connection.sendTransaction(
          routedTransaction.transaction,
          []
        );
      }

      const executionTime = Date.now() - startTime;

      this.logger.log(
        `Transaction sent successfully: ${signature}, Execution time: ${executionTime}ms`
      );

      return {
        signature,
        routingDecision: routedTransaction.routingDecision,
        executionTime,
      };
    } catch (error) {
      this.logger.error('Failed to send routed transaction', error);
      throw new Error('Transaction sending failed');
    }
  }

  /**
   * Get routing statistics
   */
  async getRoutingStatistics(): Promise<{
    totalTransactions: number;
    ephemeralRollupTransactions: number;
    solanaTransactions: number;
    averageLatency: number;
    averageCost: number;
    routingAccuracy: number;
  }> {
    try {
      // In a real implementation, this would query actual routing statistics
      // For now, return mock data
      return {
        totalTransactions: 150,
        ephemeralRollupTransactions: 120,
        solanaTransactions: 30,
        averageLatency: 25, // ms
        averageCost: 0.000002, // SOL
        routingAccuracy: 95.5, // percentage
      };
    } catch (error) {
      this.logger.error('Failed to get routing statistics', error);
      throw new Error('Statistics retrieval failed');
    }
  }

  /**
   * Get available Ephemeral Rollups
   */
  async getAvailableEphemeralRollups(): Promise<
    {
      id: string;
      status: 'active' | 'busy' | 'maintenance';
      latency: number;
      capacity: number;
      region: string;
    }[]
  > {
    try {
      // Use real MagicBlock SDK to get the closest validator
      const validatorKey = await getClosestValidator(this.connection);

      // In a real implementation, you would query multiple validators
      // For now, we'll return the closest validator with mock status
      return [
        {
          id: validatorKey.toString(),
          status: 'active' as const,
          latency: 8,
          capacity: 85,
          region: 'us-east-1',
        },
      ];
    } catch (error) {
      this.logger.error('Failed to get available Ephemeral Rollups', error);
      throw new Error('Ephemeral Rollup status retrieval failed');
    }
  }

  /**
   * Optimize routing rules based on performance data
   */
  async optimizeRoutingRules(): Promise<{
    updated: boolean;
    newRules: string[];
    performanceImprovement: number;
  }> {
    try {
      // In a real implementation, this would analyze performance data and update routing rules
      this.logger.log('Optimizing routing rules based on performance data...');

      const newRules = [
        'Prioritize ER for lending transactions with amount > $10,000',
        'Use ER for all privacy-required transactions',
        'Route high-frequency payments to ER for better throughput',
      ];

      return {
        updated: true,
        newRules,
        performanceImprovement: 12.5, // percentage
      };
    } catch (error) {
      this.logger.error('Failed to optimize routing rules', error);
      throw new Error('Routing optimization failed');
    }
  }
}
