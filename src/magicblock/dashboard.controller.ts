import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RealtimeDashboardService, DashboardMetrics, LiveTransaction, SystemHealth } from './realtime-dashboard.service';

@ApiTags('Real-time Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: RealtimeDashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get comprehensive dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      return await this.dashboardService.getDashboardMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to get dashboard metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('live-transactions')
  @ApiOperation({ summary: 'Get live transaction feed' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of transactions to return' })
  @ApiResponse({ status: 200, description: 'Live transactions retrieved successfully' })
  async getLiveTransactions(
    @Query('limit') limit?: number
  ): Promise<LiveTransaction[]> {
    try {
      return await this.dashboardService.getLiveTransactions(limit || 50);
    } catch (error) {
      throw new HttpException(
        `Failed to get live transactions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      return await this.dashboardService.getSystemHealth();
    } catch (error) {
      throw new HttpException(
        `Failed to get system health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics-history')
  @ApiOperation({ summary: 'Get metrics history for charts' })
  @ApiResponse({ status: 200, description: 'Metrics history retrieved successfully' })
  async getMetricsHistory(): Promise<DashboardMetrics[]> {
    try {
      return this.dashboardService.getMetricsHistory();
    } catch (error) {
      throw new HttpException(
        `Failed to get metrics history: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('performance-trends')
  @ApiOperation({ summary: 'Get performance trends for charts' })
  @ApiResponse({ status: 200, description: 'Performance trends retrieved successfully' })
  async getPerformanceTrends(): Promise<{
    latency: { timestamp: Date; value: number }[];
    throughput: { timestamp: Date; value: number }[];
    successRate: { timestamp: Date; value: number }[];
  }> {
    try {
      return this.dashboardService.getPerformanceTrends();
    } catch (error) {
      throw new HttpException(
        `Failed to get performance trends: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get real-time alerts' })
  @ApiResponse({ status: 200, description: 'Real-time alerts retrieved successfully' })
  async getRealTimeAlerts(): Promise<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }[]> {
    try {
      return this.dashboardService.getRealTimeAlerts();
    } catch (error) {
      throw new HttpException(
        `Failed to get real-time alerts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
