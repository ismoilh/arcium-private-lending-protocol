import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LiquidationService } from './liquidation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('liquidation')
@Controller('liquidation')
export class LiquidationController {
  constructor(private readonly liquidationService: LiquidationService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get liquidation status for all active loans' })
  @ApiResponse({ status: 200, description: 'Liquidation status retrieved' })
  async getLiquidationStatus() {
    return this.liquidationService.getLiquidationStatus();
  }

  @Post('trigger/:loanId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger liquidation for a loan' })
  @ApiResponse({ status: 200, description: 'Liquidation triggered successfully' })
  async triggerLiquidation(@Param('loanId') loanId: string) {
    return this.liquidationService.triggerLiquidation(loanId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get liquidation history' })
  @ApiResponse({ status: 200, description: 'Liquidation history retrieved' })
  async getLiquidationHistory() {
    return this.liquidationService.getLiquidationHistory();
  }
}
