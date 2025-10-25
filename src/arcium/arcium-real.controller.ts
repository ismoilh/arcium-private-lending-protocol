import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ArciumRealService,
  ArciumComputationRequest,
  ArciumComputationResult,
} from './arcium-real.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class EncryptedComputationDto {
  functionName: string;
  inputs: any[];
  metadata?: any;
}

export class RiskAssessmentDto {
  encryptedParams: any;
}

export class CollateralValidationDto {
  collateralValue: number;
  loanAmount: number;
}

export class InterestCalculationDto {
  principal: number;
  rate: number;
  time: number;
}

@ApiTags('arcium-real')
@Controller('arcium/real')
export class ArciumRealController {
  constructor(private readonly arciumRealService: ArciumRealService) {}

  @Post('compute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Perform encrypted computation using real Arcium MPC packages',
  })
  @ApiBody({ type: EncryptedComputationDto })
  @ApiResponse({
    status: 200,
    description: 'Computation completed successfully',
  })
  async performEncryptedComputation(
    @Body() request: ArciumComputationRequest
  ): Promise<ArciumComputationResult> {
    return this.arciumRealService.performEncryptedComputation(request);
  }

  @Post('risk-assessment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform encrypted risk assessment using real Arcium' })
  @ApiBody({ type: RiskAssessmentDto })
  @ApiResponse({ status: 200, description: 'Risk assessment completed' })
  async performEncryptedRiskAssessment(@Body() data: RiskAssessmentDto) {
    return this.arciumRealService.performEncryptedRiskAssessment(
      data.encryptedParams
    );
  }

  @Post('collateral-validation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Perform encrypted collateral validation using real Arcium',
  })
  @ApiBody({ type: CollateralValidationDto })
  @ApiResponse({ status: 200, description: 'Collateral validation completed' })
  async performEncryptedCollateralValidation(
    @Body() data: CollateralValidationDto
  ) {
    return this.arciumRealService.performEncryptedCollateralValidation(
      data.collateralValue,
      data.loanAmount
    );
  }

  @Post('interest-calculation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Perform encrypted interest calculation using real Arcium',
  })
  @ApiBody({ type: InterestCalculationDto })
  @ApiResponse({ status: 200, description: 'Interest calculation completed' })
  async performEncryptedInterestCalculation(
    @Body() data: InterestCalculationDto
  ) {
    return this.arciumRealService.performEncryptedInterestCalculation(
      data.principal,
      data.rate,
      data.time
    );
  }

  @Get('computation/:computationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get computation status using real Arcium reader' })
  @ApiResponse({ status: 200, description: 'Computation status retrieved' })
  async getComputationStatus(@Param('computationId') computationId: string) {
    return this.arciumRealService.getComputationStatus(computationId);
  }

  @Get('network-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Arcium network status using real reader' })
  @ApiResponse({ status: 200, description: 'Network status retrieved' })
  async getNetworkStatus() {
    return this.arciumRealService.getNetworkStatus();
  }

  @Get('computation-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get computation history using real Arcium reader' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Computation history retrieved' })
  async getComputationHistory(@Query('limit') limit?: number) {
    return this.arciumRealService.getComputationHistory(limit);
  }

  @Post('estimate-cost')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estimate computation cost using real Arcium pricing' })
  @ApiBody({ type: EncryptedComputationDto })
  @ApiResponse({ status: 200, description: 'Cost estimation completed' })
  async estimateComputationCost(@Body() request: ArciumComputationRequest) {
    return this.arciumRealService.estimateComputationCost(request);
  }

  @Get('functions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get available computation functions using real Arcium client',
  })
  @ApiResponse({ status: 200, description: 'Available functions retrieved' })
  async getAvailableFunctions() {
    return this.arciumRealService.getAvailableFunctions();
  }

  @Get('health')
  @ApiOperation({ summary: 'Real Arcium service health check' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  async healthCheck(): Promise<{ healthy: boolean }> {
    const healthy = await this.arciumRealService.healthCheck();
    return { healthy };
  }
}
