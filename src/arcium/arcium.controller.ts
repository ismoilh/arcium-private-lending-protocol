import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ArciumIntegrationService,
  ArciumComputeRequest,
} from './arcium-integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class ArciumComputeDto {
  functionName: string;
  encryptedInputs: any[];
  metadata?: any;
}

@ApiTags('arcium')
@Controller('arcium')
export class ArciumController {
  constructor(private readonly arciumService: ArciumIntegrationService) {}

  @Post('compute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform encrypted computation using Arcium MPC' })
  @ApiBody({ type: ArciumComputeDto })
  @ApiResponse({
    status: 200,
    description: 'Computation completed successfully',
  })
  async performEncryptedComputation(@Body() request: ArciumComputeRequest) {
    return this.arciumService.performEncryptedComputation(request);
  }

  @Get('network-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Arcium network status' })
  @ApiResponse({ status: 200, description: 'Network status retrieved' })
  async getNetworkStatus() {
    return this.arciumService.getNetworkStatus();
  }

  @Post('estimate-cost')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estimate computation cost' })
  @ApiBody({ type: ArciumComputeDto })
  @ApiResponse({ status: 200, description: 'Cost estimation completed' })
  async estimateCost(@Body() request: ArciumComputeRequest) {
    return this.arciumService.estimateCost(request);
  }

  @Get('health')
  @ApiOperation({ summary: 'Arcium service health check' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  async healthCheck(): Promise<{ healthy: boolean }> {
    const status = await this.arciumService.getNetworkStatus();
    return { healthy: status.connected };
  }
}
