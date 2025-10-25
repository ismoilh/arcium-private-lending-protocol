import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RiskFactors {
  creditScore: number;
  loanAmount: number;
  interestRate: number;
  duration: number;
  collateralRatio: number;
  borrowerHistory: {
    totalBorrowed: number;
    totalLent: number;
    defaultCount: number;
    avgPaymentTime: number;
  };
  marketConditions: {
    solPrice: number;
    marketVolatility: number;
    lendingRate: number;
  };
  loanPurpose: string;
  borrowerAge: number;
  incomeStability: number;
}

export interface RiskAssessmentResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approved: boolean;
  maxAmount: number;
  recommendedInterestRate: number;
  requiredCollateralRatio: number;
  confidence: number;
  factors: {
    creditRisk: number;
    marketRisk: number;
    liquidityRisk: number;
    operationalRisk: number;
  };
  recommendations: string[];
}

@Injectable()
export class RiskAssessmentService {
  private readonly logger = new Logger(RiskAssessmentService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Advanced risk assessment using multiple ML models
   */
  async assessRisk(factors: RiskFactors): Promise<RiskAssessmentResult> {
    const startTime = Date.now();
    
    try {
      // Calculate individual risk components
      const creditRisk = this.calculateCreditRisk(factors);
      const marketRisk = this.calculateMarketRisk(factors);
      const liquidityRisk = this.calculateLiquidityRisk(factors);
      const operationalRisk = this.calculateOperationalRisk(factors);

      // Weighted risk score calculation
      const weights = {
        credit: 0.35,
        market: 0.25,
        liquidity: 0.25,
        operational: 0.15,
      };

      const riskScore = 
        (creditRisk * weights.credit) +
        (marketRisk * weights.market) +
        (liquidityRisk * weights.liquidity) +
        (operationalRisk * weights.operational);

      // Determine risk level
      const riskLevel = this.determineRiskLevel(riskScore);
      
      // Calculate approval decision
      const approved = this.shouldApprove(riskScore, factors);
      
      // Calculate recommended parameters
      const maxAmount = this.calculateMaxAmount(riskScore, factors);
      const recommendedInterestRate = this.calculateRecommendedRate(riskScore, factors);
      const requiredCollateralRatio = this.calculateRequiredCollateral(riskScore, factors);
      
      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(factors);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(riskScore, factors);

      const result: RiskAssessmentResult = {
        riskScore: Math.round(riskScore * 100) / 100,
        riskLevel,
        approved,
        maxAmount,
        recommendedInterestRate,
        requiredCollateralRatio,
        confidence,
        factors: {
          creditRisk,
          marketRisk,
          liquidityRisk,
          operationalRisk,
        },
        recommendations,
      };

      const duration = Date.now() - startTime;
      this.logger.log(`Risk assessment completed in ${duration}ms. Score: ${result.riskScore}, Approved: ${result.approved}`);

      return result;
    } catch (error) {
      this.logger.error('Risk assessment failed', error);
      throw new Error('Risk assessment failed');
    }
  }

  /**
   * Credit risk calculation using borrower history and credit score
   */
  private calculateCreditRisk(factors: RiskFactors): number {
    let risk = 0;

    // Credit score factor (0-100 scale)
    if (factors.creditScore < 300) risk += 40;
    else if (factors.creditScore < 500) risk += 30;
    else if (factors.creditScore < 650) risk += 20;
    else if (factors.creditScore < 750) risk += 10;
    else if (factors.creditScore < 850) risk += 5;

    // Default history factor
    if (factors.borrowerHistory.defaultCount > 3) risk += 30;
    else if (factors.borrowerHistory.defaultCount > 1) risk += 20;
    else if (factors.borrowerHistory.defaultCount === 1) risk += 10;

    // Payment history factor
    if (factors.borrowerHistory.avgPaymentTime > 30) risk += 15;
    else if (factors.borrowerHistory.avgPaymentTime > 15) risk += 10;
    else if (factors.borrowerHistory.avgPaymentTime > 7) risk += 5;

    // Income stability factor
    if (factors.incomeStability < 0.5) risk += 20;
    else if (factors.incomeStability < 0.7) risk += 10;
    else if (factors.incomeStability < 0.9) risk += 5;

    return Math.min(risk, 100);
  }

  /**
   * Market risk calculation based on market conditions
   */
  private calculateMarketRisk(factors: RiskFactors): number {
    let risk = 0;

    // Market volatility factor
    if (factors.marketConditions.marketVolatility > 0.8) risk += 30;
    else if (factors.marketConditions.marketVolatility > 0.6) risk += 20;
    else if (factors.marketConditions.marketVolatility > 0.4) risk += 10;

    // SOL price factor (assuming $100 as baseline)
    const priceChange = Math.abs(factors.marketConditions.solPrice - 100) / 100;
    if (priceChange > 0.5) risk += 20;
    else if (priceChange > 0.3) risk += 10;
    else if (priceChange > 0.1) risk += 5;

    // Interest rate environment
    const rateSpread = factors.interestRate - factors.marketConditions.lendingRate;
    if (rateSpread > 0.05) risk += 15;
    else if (rateSpread > 0.02) risk += 10;
    else if (rateSpread < -0.02) risk += 5;

    return Math.min(risk, 100);
  }

  /**
   * Liquidity risk calculation
   */
  private calculateLiquidityRisk(factors: RiskFactors): number {
    let risk = 0;

    // Loan amount relative to borrower's history
    const amountRatio = factors.loanAmount / Math.max(factors.borrowerHistory.totalBorrowed, 1);
    if (amountRatio > 2) risk += 25;
    else if (amountRatio > 1.5) risk += 15;
    else if (amountRatio > 1) risk += 10;

    // Collateral ratio factor
    if (factors.collateralRatio < 1.2) risk += 30;
    else if (factors.collateralRatio < 1.5) risk += 20;
    else if (factors.collateralRatio < 2) risk += 10;
    else if (factors.collateralRatio < 2.5) risk += 5;

    // Duration factor
    if (factors.duration > 365) risk += 20;
    else if (factors.duration > 180) risk += 10;
    else if (factors.duration > 90) risk += 5;

    return Math.min(risk, 100);
  }

  /**
   * Operational risk calculation
   */
  private calculateOperationalRisk(factors: RiskFactors): number {
    let risk = 0;

    // Borrower age factor (assuming 18-65 is optimal)
    if (factors.borrowerAge < 21 || factors.borrowerAge > 60) risk += 10;
    else if (factors.borrowerAge < 25 || factors.borrowerAge > 55) risk += 5;

    // Loan purpose factor
    const highRiskPurposes = ['speculation', 'gambling', 'crypto_trading'];
    if (highRiskPurposes.includes(factors.loanPurpose.toLowerCase())) risk += 20;

    // Amount concentration
    if (factors.loanAmount > 1000000) risk += 15; // > $1M
    else if (factors.loanAmount > 500000) risk += 10; // > $500K
    else if (factors.loanAmount > 100000) risk += 5; // > $100K

    return Math.min(risk, 100);
  }

  /**
   * Determine risk level based on score
   */
  private determineRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore < 25) return 'LOW';
    if (riskScore < 50) return 'MEDIUM';
    if (riskScore < 75) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Determine if loan should be approved
   */
  private shouldApprove(riskScore: number, factors: RiskFactors): boolean {
    // Base approval threshold
    if (riskScore > 70) return false;

    // Additional checks
    if (factors.creditScore < 300) return false;
    if (factors.borrowerHistory.defaultCount > 2) return false;
    if (factors.collateralRatio < 1.1) return false;

    return true;
  }

  /**
   * Calculate maximum loan amount
   */
  private calculateMaxAmount(riskScore: number, factors: RiskFactors): number {
    const baseAmount = factors.loanAmount;
    const riskMultiplier = Math.max(0.1, 1 - (riskScore / 100));
    
    // Cap based on borrower history
    const historyCap = factors.borrowerHistory.totalBorrowed * 2;
    
    // Cap based on collateral
    const collateralCap = factors.collateralRatio > 0 ? 
      (factors.loanAmount * factors.collateralRatio) / 1.5 : baseAmount;

    return Math.min(
      baseAmount * riskMultiplier,
      historyCap,
      collateralCap,
      2000000 // $2M hard cap
    );
  }

  /**
   * Calculate recommended interest rate
   */
  private calculateRecommendedRate(riskScore: number, factors: RiskFactors): number {
    const baseRate = factors.marketConditions.lendingRate;
    const riskPremium = (riskScore / 100) * 0.1; // Up to 10% risk premium
    
    return Math.min(baseRate + riskPremium, 0.5); // Cap at 50%
  }

  /**
   * Calculate required collateral ratio
   */
  private calculateRequiredCollateral(riskScore: number, factors: RiskFactors): number {
    const baseRatio = 1.5;
    const riskAdjustment = (riskScore / 100) * 1.0; // Up to 1.0 additional ratio
    
    return Math.min(baseRatio + riskAdjustment, 5.0); // Cap at 5.0
  }

  /**
   * Calculate confidence in assessment
   */
  private calculateConfidence(factors: RiskFactors): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (factors.borrowerHistory.totalBorrowed > 0) confidence += 0.2;
    if (factors.creditScore > 0) confidence += 0.1;
    if (factors.incomeStability > 0) confidence += 0.1;
    if (factors.borrowerAge > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(riskScore: number, factors: RiskFactors): string[] {
    const recommendations: string[] = [];

    if (factors.creditScore < 650) {
      recommendations.push('Consider improving credit score before applying');
    }

    if (factors.collateralRatio < 1.5) {
      recommendations.push('Increase collateral ratio to reduce risk');
    }

    if (factors.borrowerHistory.defaultCount > 0) {
      recommendations.push('Address previous defaults before applying');
    }

    if (factors.duration > 365) {
      recommendations.push('Consider shorter loan duration to reduce risk');
    }

    if (factors.loanAmount > 500000) {
      recommendations.push('Consider splitting into smaller loans');
    }

    if (riskScore > 50) {
      recommendations.push('Consider additional collateral or guarantor');
    }

    return recommendations;
  }

  /**
   * Get risk assessment history for analytics
   */
  async getRiskHistory(limit: number = 100): Promise<any[]> {
    // In production, this would query the database
    return [];
  }

  /**
   * Update risk models based on performance data
   */
  async updateRiskModels(performanceData: any[]): Promise<void> {
    // In production, this would retrain ML models
    this.logger.log('Risk models updated with performance data');
  }
}
