import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RiskAssessmentService, RiskFactors, RiskAssessmentResult } from './risk-assessment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class RiskAssessmentDto {
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

@ApiTags('risk-assessment')
@Controller('risk')
export class RiskController {
  constructor(private readonly riskAssessmentService: RiskAssessmentService) {}

  @Post('assess')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform advanced risk assessment' })
  @ApiBody({ type: RiskAssessmentDto })
  @ApiResponse({ status: 200, description: 'Risk assessment completed' })
  async assessRisk(@Body() factors: RiskFactors): Promise<RiskAssessmentResult> {
    return this.riskAssessmentService.assessRisk(factors);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get risk assessment history' })
  @ApiResponse({ status: 200, description: 'Risk history retrieved' })
  async getRiskHistory(@Param('limit') limit?: number): Promise<any[]> {
    return this.riskAssessmentService.getRiskHistory(limit);
  }

  @Post('update-models')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update risk models with performance data' })
  @ApiResponse({ status: 200, description: 'Models updated successfully' })
  async updateModels(@Body() performanceData: any[]): Promise<void> {
    return this.riskAssessmentService.updateRiskModels(performanceData);
  }
}
