import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActiveLoan, ActiveLoanStatus } from '../entities/active-loan.entity';
import { User } from '../entities/user.entity';
import { SolanaService } from '../solana/solana.service';
import { MonitoringService } from '../monitoring/monitoring.service';

export interface LiquidationCheck {
  loanId: string;
  currentCollateralRatio: number;
  requiredCollateralRatio: number;
  needsLiquidation: boolean;
  liquidationAmount: number;
  collateralValue: number;
  debtAmount: number;
}

export interface LiquidationResult {
  success: boolean;
  loanId: string;
  liquidatedAmount: number;
  remainingDebt: number;
  transactionHash?: string;
  error?: string;
}

@Injectable()
export class LiquidationService {
  private readonly logger = new Logger(LiquidationService.name);
  private readonly LIQUIDATION_THRESHOLD = 1.2; // 120% collateral ratio threshold
  private readonly LIQUIDATION_PENALTY = 0.05; // 5% penalty

  constructor(
    @InjectRepository(ActiveLoan)
    private activeLoanRepository: Repository<ActiveLoan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private solanaService: SolanaService,
    private monitoringService: MonitoringService,
  ) {}

  /**
   * Scheduled liquidation check - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async performLiquidationChecks(): Promise<void> {
    this.logger.log('Starting scheduled liquidation checks...');
    
    try {
      const activeLoans = await this.activeLoanRepository.find({
        where: { status: ActiveLoanStatus.ACTIVE },
        relations: ['borrower', 'lender'],
      });

      for (const loan of activeLoans) {
        await this.checkLoanForLiquidation(loan);
      }

      this.logger.log(`Liquidation checks completed for ${activeLoans.length} loans`);
    } catch (error) {
      this.logger.error('Error during liquidation checks', error);
      await this.monitoringService.recordError(error, 'liquidation_checks');
    }
  }

  /**
   * Check individual loan for liquidation
   */
  async checkLoanForLiquidation(loan: ActiveLoan): Promise<LiquidationCheck | null> {
    try {
      // Get current collateral value (in production, this would be real-time)
      const collateralValue = await this.getCurrentCollateralValue(loan);
      const debtAmount = loan.remainingAmount;
      const currentRatio = collateralValue / debtAmount;
      const requiredRatio = this.LIQUIDATION_THRESHOLD;

      const needsLiquidation = currentRatio < requiredRatio;
      const liquidationAmount = needsLiquidation ? 
        debtAmount - (collateralValue / requiredRatio) : 0;

      const check: LiquidationCheck = {
        loanId: loan.id,
        currentCollateralRatio: currentRatio,
        requiredCollateralRatio: requiredRatio,
        needsLiquidation,
        liquidationAmount: Math.max(0, liquidationAmount),
        collateralValue,
        debtAmount,
      };

      // Update loan with current collateral ratio
      await this.activeLoanRepository.update(loan.id, {
        currentCollateralRatio: currentRatio,
        collateralValue,
      });

      if (needsLiquidation) {
        this.logger.warn(`Loan ${loan.id} needs liquidation. Ratio: ${currentRatio.toFixed(2)}`);
        await this.monitoringService.trackLoanEvent(loan.id, 'liquidation_required', check);
        
        // Trigger liquidation
        await this.liquidateLoan(loan, liquidationAmount);
      }

      return check;
    } catch (error) {
      this.logger.error(`Error checking loan ${loan.id} for liquidation`, error);
      await this.monitoringService.recordError(error, 'liquidation_check', { loanId: loan.id });
      return null;
    }
  }

  /**
   * Liquidate a loan
   */
  async liquidateLoan(loan: ActiveLoan, liquidationAmount: number): Promise<LiquidationResult> {
    try {
      this.logger.log(`Starting liquidation for loan ${loan.id}, amount: ${liquidationAmount}`);

      // Calculate liquidation penalty
      const penaltyAmount = liquidationAmount * this.LIQUIDATION_PENALTY;
      const totalLiquidationAmount = liquidationAmount + penaltyAmount;

      // Check if borrower has sufficient collateral
      const collateralValue = await this.getCurrentCollateralValue(loan);
      if (collateralValue < totalLiquidationAmount) {
        // Partial liquidation
        const actualLiquidationAmount = collateralValue * 0.95; // 95% of collateral value
        
        // Execute partial liquidation
        const result = await this.executeLiquidation(loan, actualLiquidationAmount);
        
        // Update loan status
        await this.activeLoanRepository.update(loan.id, {
          status: ActiveLoanStatus.LIQUIDATED,
          remainingAmount: loan.remainingAmount - actualLiquidationAmount,
        });

        await this.monitoringService.trackLoanEvent(loan.id, 'loan_liquidated_partial', {
          liquidatedAmount: actualLiquidationAmount,
          remainingDebt: loan.remainingAmount - actualLiquidationAmount,
        });

        return {
          success: true,
          loanId: loan.id,
          liquidatedAmount: actualLiquidationAmount,
          remainingDebt: loan.remainingAmount - actualLiquidationAmount,
          transactionHash: result.transactionHash,
        };
      } else {
        // Full liquidation
        const result = await this.executeLiquidation(loan, totalLiquidationAmount);
        
        // Update loan status
        await this.activeLoanRepository.update(loan.id, {
          status: ActiveLoanStatus.LIQUIDATED,
          remainingAmount: 0,
        });

        await this.monitoringService.trackLoanEvent(loan.id, 'loan_liquidated_full', {
          liquidatedAmount: totalLiquidationAmount,
          remainingDebt: 0,
        });

        return {
          success: true,
          loanId: loan.id,
          liquidatedAmount: totalLiquidationAmount,
          remainingDebt: 0,
          transactionHash: result.transactionHash,
        };
      }
    } catch (error) {
      this.logger.error(`Error liquidating loan ${loan.id}`, error);
      await this.monitoringService.recordError(error, 'liquidation_execution', { loanId: loan.id });
      
      return {
        success: false,
        loanId: loan.id,
        liquidatedAmount: 0,
        remainingDebt: loan.remainingAmount,
        error: error.message,
      };
    }
  }

  /**
   * Execute the actual liquidation transaction
   */
  private async executeLiquidation(loan: ActiveLoan, amount: number): Promise<{ transactionHash: string }> {
    try {
      // In production, this would execute actual Solana transactions
      // For now, we'll simulate the transaction
      
      // Get borrower's wallet
      const borrower = await this.userRepository.findOne({
        where: { id: loan.borrowerId },
      });

      if (!borrower || !borrower.walletAddress) {
        throw new Error('Borrower wallet not found');
      }

      // Simulate collateral transfer to lender
      const transactionHash = `liquidation_${loan.id}_${Date.now()}`;
      
      // In production, this would:
      // 1. Transfer collateral from borrower to lender
      // 2. Update token balances
      // 3. Record the transaction on Solana
      
      this.logger.log(`Liquidation transaction executed: ${transactionHash}`);
      
      return { transactionHash };
    } catch (error) {
      this.logger.error('Error executing liquidation transaction', error);
      throw error;
    }
  }

  /**
   * Get current collateral value for a loan
   */
  private async getCurrentCollateralValue(loan: ActiveLoan): Promise<number> {
    try {
      // In production, this would fetch real-time prices from oracles
      // For now, we'll use a simulated value
      
      const baseValue = loan.collateralValue || (loan.principalAmount * 2);
      const volatility = 0.1; // 10% volatility
      const randomFactor = (Math.random() - 0.5) * 2 * volatility;
      
      return baseValue * (1 + randomFactor);
    } catch (error) {
      this.logger.error('Error getting collateral value', error);
      return loan.collateralValue || 0;
    }
  }

  /**
   * Get liquidation status for all active loans
   */
  async getLiquidationStatus(): Promise<{
    totalActiveLoans: number;
    atRiskLoans: number;
    criticalLoans: number;
    liquidationChecks: LiquidationCheck[];
  }> {
    const activeLoans = await this.activeLoanRepository.find({
      where: { status: ActiveLoanStatus.ACTIVE },
    });

    const liquidationChecks: LiquidationCheck[] = [];
    let atRiskLoans = 0;
    let criticalLoans = 0;

    for (const loan of activeLoans) {
      const check = await this.checkLoanForLiquidation(loan);
      if (check) {
        liquidationChecks.push(check);
        
        if (check.currentCollateralRatio < 1.5) {
          atRiskLoans++;
        }
        if (check.currentCollateralRatio < 1.2) {
          criticalLoans++;
        }
      }
    }

    return {
      totalActiveLoans: activeLoans.length,
      atRiskLoans,
      criticalLoans,
      liquidationChecks,
    };
  }

  /**
   * Manual liquidation trigger (for admin use)
   */
  async triggerLiquidation(loanId: string): Promise<LiquidationResult> {
    const loan = await this.activeLoanRepository.findOne({
      where: { id: loanId, status: ActiveLoanStatus.ACTIVE },
    });

    if (!loan) {
      throw new Error('Active loan not found');
    }

    const check = await this.checkLoanForLiquidation(loan);
    if (!check || !check.needsLiquidation) {
      throw new Error('Loan does not meet liquidation criteria');
    }

    return this.liquidateLoan(loan, check.liquidationAmount);
  }

  /**
   * Get liquidation history
   */
  async getLiquidationHistory(limit: number = 50): Promise<ActiveLoan[]> {
    return this.activeLoanRepository.find({
      where: { status: ActiveLoanStatus.LIQUIDATED },
      order: { updatedAt: 'DESC' },
      take: limit,
      relations: ['borrower', 'lender'],
    });
  }
}
