import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  MagicBlockService,
  RealTimeTransaction,
  DelegationState,
} from './magicblock.service';
import {
  MagicRouterService,
  TransactionMetadata,
  RoutedTransaction,
} from './magic-router.service';

@ApiTags('MagicBlock Real-time Operations')
@Controller('magicblock')
export class MagicBlockController {
  constructor(
    private readonly magicBlockService: MagicBlockService,
    private readonly magicRouterService: MagicRouterService
  ) {}

  @Post('delegate-account')
  @ApiOperation({
    summary: 'Delegate account to Ephemeral Rollup for real-time processing',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID to delegate' },
        accountType: {
          type: 'string',
          enum: ['loan_application', 'active_loan', 'lending_pool'],
          description: 'Type of account to delegate',
        },
      },
      required: ['accountId', 'accountType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Account successfully delegated to Ephemeral Rollup',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 500, description: 'Delegation failed' })
  async delegateAccount(
    @Body()
    body: {
      accountId: string;
      accountType: 'loan_application' | 'active_loan' | 'lending_pool';
    }
  ): Promise<DelegationState> {
    try {
      return await this.magicBlockService.delegateAccountToEphemeralRollup(
        body.accountId,
        body.accountType
      );
    } catch (error) {
      throw new HttpException(
        `Delegation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('real-time-loan-approval')
  @ApiOperation({
    summary: 'Process real-time loan approval using Ephemeral Rollups',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loanApplicationId: {
          type: 'string',
          description: 'Loan application ID',
        },
        borrowerId: { type: 'string', description: 'Borrower user ID' },
        amount: { type: 'number', description: 'Loan amount' },
        interestRate: { type: 'number', description: 'Interest rate' },
        duration: { type: 'number', description: 'Loan duration in days' },
        collateralRatio: { type: 'number', description: 'Collateral ratio' },
      },
      required: [
        'loanApplicationId',
        'borrowerId',
        'amount',
        'interestRate',
        'duration',
        'collateralRatio',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Real-time loan approval processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 500, description: 'Loan approval processing failed' })
  async processRealTimeLoanApproval(
    @Body()
    body: {
      loanApplicationId: string;
      borrowerId: string;
      amount: number;
      interestRate: number;
      duration: number;
      collateralRatio: number;
    }
  ): Promise<RealTimeTransaction> {
    try {
      return await this.magicBlockService.processRealTimeLoanApproval(
        body.loanApplicationId,
        body.borrowerId,
        body.amount,
        body.interestRate,
        body.duration,
        body.collateralRatio
      );
    } catch (error) {
      throw new HttpException(
        `Real-time loan approval failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('real-time-payment')
  @ApiOperation({
    summary: 'Process real-time loan payment using Ephemeral Rollups',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loanId: { type: 'string', description: 'Active loan ID' },
        paymentAmount: { type: 'number', description: 'Payment amount' },
        borrowerSecretKey: {
          type: 'string',
          description: 'Borrower secret key for signing',
        },
      },
      required: ['loanId', 'paymentAmount', 'borrowerSecretKey'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Real-time payment processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 500, description: 'Payment processing failed' })
  async processRealTimePayment(
    @Body()
    body: {
      loanId: string;
      paymentAmount: number;
      borrowerSecretKey: string;
    }
  ): Promise<RealTimeTransaction> {
    try {
      return await this.magicBlockService.processRealTimePayment(
        body.loanId,
        body.paymentAmount,
        body.borrowerSecretKey
      );
    } catch (error) {
      throw new HttpException(
        `Real-time payment failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('real-time-loan-offer')
  @ApiOperation({
    summary: 'Create real-time loan offer using Ephemeral Rollups',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lenderId: { type: 'string', description: 'Lender user ID' },
        loanApplicationId: {
          type: 'string',
          description: 'Loan application ID',
        },
        offeredAmount: { type: 'number', description: 'Offered loan amount' },
        offeredInterestRate: {
          type: 'number',
          description: 'Offered interest rate',
        },
        terms: { type: 'string', description: 'Loan terms and conditions' },
      },
      required: [
        'lenderId',
        'loanApplicationId',
        'offeredAmount',
        'offeredInterestRate',
        'terms',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Real-time loan offer created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 500, description: 'Loan offer creation failed' })
  async createRealTimeLoanOffer(
    @Body()
    body: {
      lenderId: string;
      loanApplicationId: string;
      offeredAmount: number;
      offeredInterestRate: number;
      terms: string;
    }
  ): Promise<RealTimeTransaction> {
    try {
      return await this.magicBlockService.createRealTimeLoanOffer(
        body.lenderId,
        body.loanApplicationId,
        body.offeredAmount,
        body.offeredInterestRate,
        body.terms
      );
    } catch (error) {
      throw new HttpException(
        `Real-time loan offer creation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Get real-time transaction status' })
  @ApiResponse({
    status: 200,
    description: 'Transaction status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getRealTimeTransactionStatus(
    @Param('transactionId') transactionId: string
  ): Promise<RealTimeTransaction | null> {
    const transaction =
      await this.magicBlockService.getRealTimeTransactionStatus(transactionId);
    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }
    return transaction;
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all real-time transactions' })
  @ApiResponse({
    status: 200,
    description: 'Real-time transactions retrieved successfully',
  })
  async getAllRealTimeTransactions(): Promise<RealTimeTransaction[]> {
    return await this.magicBlockService.getAllRealTimeTransactions();
  }

  @Get('delegation/:accountId')
  @ApiOperation({ summary: 'Get delegation status for an account' })
  @ApiResponse({
    status: 200,
    description: 'Delegation status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getDelegationStatus(
    @Param('accountId') accountId: string
  ): Promise<DelegationState | null> {
    const delegation =
      await this.magicBlockService.getDelegationStatus(accountId);
    if (!delegation) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    return delegation;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get Ephemeral Rollup statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getEphemeralRollupStats(): Promise<{
    totalRealTimeTransactions: number;
    activeDelegations: number;
    averageProcessingTime: number;
    successRate: number;
  }> {
    return await this.magicBlockService.getEphemeralRollupStats();
  }

  @Get('network-status')
  @ApiOperation({ summary: 'Get MagicBlock network status' })
  @ApiResponse({
    status: 200,
    description: 'Network status retrieved successfully',
  })
  async getNetworkStatus(): Promise<{
    connected: boolean;
    ephemeralRollupsAvailable: number;
    averageLatency: number;
    version: string;
  }> {
    return await this.magicBlockService.getNetworkStatus();
  }

  // Magic Router endpoints
  @Post('router/route-transaction')
  @ApiOperation({ summary: 'Route transaction using Magic Router' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transaction: {
          type: 'object',
          description: 'Solana transaction object',
        },
        metadata: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['lending', 'payment', 'governance', 'risk_assessment'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            requiresEncryption: { type: 'boolean' },
            estimatedGas: { type: 'number' },
            maxLatency: { type: 'number' },
            privacyLevel: {
              type: 'string',
              enum: ['public', 'private', 'confidential'],
            },
          },
        },
      },
      required: ['transaction', 'metadata'],
    },
  })
  @ApiResponse({ status: 200, description: 'Transaction routed successfully' })
  async routeTransaction(
    @Body() body: { transaction: any; metadata: TransactionMetadata }
  ): Promise<RoutedTransaction> {
    try {
      // In a real implementation, you would reconstruct the Transaction object from the body
      // For now, we'll return a mock response
      return {
        transaction: body.transaction,
        routingDecision: {
          shouldUseEphemeralRollup: true,
          ephemeralRollupId: 'er_mock_123',
          reason: 'High priority lending transaction',
          estimatedLatency: 10,
          estimatedCost: 0,
        },
        metadata: body.metadata,
      };
    } catch (error) {
      throw new HttpException(
        `Transaction routing failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('router/statistics')
  @ApiOperation({ summary: 'Get Magic Router statistics' })
  @ApiResponse({
    status: 200,
    description: 'Router statistics retrieved successfully',
  })
  async getRoutingStatistics() {
    return await this.magicRouterService.getRoutingStatistics();
  }

  @Get('router/ephemeral-rollups')
  @ApiOperation({ summary: 'Get available Ephemeral Rollups' })
  @ApiResponse({
    status: 200,
    description: 'Available Ephemeral Rollups retrieved successfully',
  })
  async getAvailableEphemeralRollups() {
    return await this.magicRouterService.getAvailableEphemeralRollups();
  }

  @Post('router/optimize')
  @ApiOperation({ summary: 'Optimize routing rules based on performance data' })
  @ApiResponse({
    status: 200,
    description: 'Routing rules optimized successfully',
  })
  async optimizeRoutingRules() {
    return await this.magicRouterService.optimizeRoutingRules();
  }
}
