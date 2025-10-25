import { Injectable, Logger } from '@nestjs/common';
import { MagicBlockService } from './magicblock.service';
import { MagicRouterService } from './magic-router.service';
import { LendingService } from '../lending/lending.service';

export interface DashboardMetrics {
  realTimeTransactions: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  lendingActivity: {
    totalApplications: number;
    approvedApplications: number;
    activeLoans: number;
    totalLent: number;
    averageInterestRate: number;
  };
  networkPerformance: {
    averageLatency: number;
    successRate: number;
    throughput: number;
    activeDelegations: number;
  };
  ephemeralRollups: {
    available: number;
    active: number;
    averageLatency: number;
    capacity: number;
  };
}

export interface LiveTransaction {
  id: string;
  type: string;
  status: string;
  timestamp: Date;
  latency?: number;
  ephemeralRollupId?: string;
  borrowerId?: string;
  lenderId?: string;
  amount?: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    magicBlock: 'healthy' | 'degraded' | 'critical';
    lending: 'healthy' | 'degraded' | 'critical';
    solana: 'healthy' | 'degraded' | 'critical';
    ephemeralRollups: 'healthy' | 'degraded' | 'critical';
  };
  alerts: string[];
  lastUpdated: Date;
}

@Injectable()
export class RealtimeDashboardService {
  private readonly logger = new Logger(RealtimeDashboardService.name);
  private liveTransactions: Map<string, LiveTransaction> = new Map();
  private metricsHistory: DashboardMetrics[] = [];
  private readonly maxHistorySize = 100;

  constructor(
    private magicBlockService: MagicBlockService,
    private magicRouterService: MagicRouterService,
    private lendingService: LendingService,
  ) {
    // Start metrics collection
    this.startMetricsCollection();
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get real-time transaction metrics
      const realTimeTransactions = await this.magicBlockService.getAllRealTimeTransactions();
      const realTimeStats = await this.magicBlockService.getEphemeralRollupStats();

      // Get lending activity metrics
      const lendingStats = await this.lendingService.getLendingStatistics();

      // Get network performance metrics
      const networkStatus = await this.magicBlockService.getNetworkStatus();
      const routingStats = await this.magicRouterService.getRoutingStatistics();

      // Get Ephemeral Rollup metrics
      const availableERs = await this.magicRouterService.getAvailableEphemeralRollups();

      const metrics: DashboardMetrics = {
        realTimeTransactions: {
          total: realTimeTransactions.length,
          pending: realTimeTransactions.filter(tx => tx.status === 'pending').length,
          processing: realTimeTransactions.filter(tx => tx.status === 'processing').length,
          completed: realTimeTransactions.filter(tx => tx.status === 'completed').length,
          failed: realTimeTransactions.filter(tx => tx.status === 'failed').length,
        },
        lendingActivity: {
          totalApplications: lendingStats.totalApplications,
          approvedApplications: lendingStats.approvedApplications,
          activeLoans: lendingStats.activeLoans,
          totalLent: lendingStats.totalLent,
          averageInterestRate: lendingStats.averageInterestRate,
        },
        networkPerformance: {
          averageLatency: routingStats.averageLatency,
          successRate: routingStats.routingAccuracy,
          throughput: this.calculateThroughput(),
          activeDelegations: realTimeStats.activeDelegations,
        },
        ephemeralRollups: {
          available: availableERs.length,
          active: availableERs.filter(er => er.status === 'active').length,
          averageLatency: availableERs.reduce((sum, er) => sum + er.latency, 0) / availableERs.length,
          capacity: availableERs.reduce((sum, er) => sum + er.capacity, 0) / availableERs.length,
        },
      };

      // Store metrics in history
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get dashboard metrics', error);
      throw new Error('Dashboard metrics retrieval failed');
    }
  }

  /**
   * Get live transaction feed
   */
  async getLiveTransactions(limit: number = 50): Promise<LiveTransaction[]> {
    try {
      const realTimeTransactions = await this.magicBlockService.getAllRealTimeTransactions();
      
      const liveTransactions: LiveTransaction[] = realTimeTransactions
        .slice(0, limit)
        .map(tx => ({
          id: tx.id,
          type: tx.type,
          status: tx.status,
          timestamp: tx.timestamp,
          latency: this.calculateLatency(tx),
          ephemeralRollupId: tx.ephemeralRollupId,
          borrowerId: tx.data.borrowerId,
          lenderId: tx.data.lenderId,
          amount: tx.data.amount || tx.data.paymentAmount,
        }));

      // Update live transactions cache
      liveTransactions.forEach(tx => {
        this.liveTransactions.set(tx.id, tx);
      });

      return liveTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      this.logger.error('Failed to get live transactions', error);
      throw new Error('Live transactions retrieval failed');
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const alerts: string[] = [];
      let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';

      // Check MagicBlock health
      const networkStatus = await this.magicBlockService.getNetworkStatus();
      const magicBlockHealth = networkStatus.connected ? 'healthy' : 'critical';
      if (!networkStatus.connected) {
        alerts.push('MagicBlock network disconnected');
        overallHealth = 'critical';
      }

      // Check lending service health
      const lendingStats = await this.lendingService.getLendingStatistics();
      const lendingHealth = lendingStats.totalApplications > 0 ? 'healthy' : 'degraded';
      if (lendingStats.totalApplications === 0) {
        alerts.push('No lending activity detected');
        if (overallHealth === 'healthy') overallHealth = 'degraded';
      }

      // Check Solana health (mock)
      const solanaHealth = 'healthy';

      // Check Ephemeral Rollups health
      const availableERs = await this.magicRouterService.getAvailableEphemeralRollups();
      const activeERs = availableERs.filter(er => er.status === 'active').length;
      const ephemeralRollupsHealth = activeERs > 0 ? 'healthy' : 'critical';
      if (activeERs === 0) {
        alerts.push('No active Ephemeral Rollups available');
        overallHealth = 'critical';
      }

      // Check for performance issues
      const routingStats = await this.magicRouterService.getRoutingStatistics();
      if (routingStats.averageLatency > 100) {
        alerts.push('High latency detected in transaction routing');
        if (overallHealth === 'healthy') overallHealth = 'degraded';
      }

      if (routingStats.routingAccuracy < 90) {
        alerts.push('Low routing accuracy detected');
        if (overallHealth === 'healthy') overallHealth = 'degraded';
      }

      return {
        overall: overallHealth,
        components: {
          magicBlock: magicBlockHealth,
          lending: lendingHealth,
          solana: solanaHealth,
          ephemeralRollups: ephemeralRollupsHealth,
        },
        alerts,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get system health', error);
      return {
        overall: 'critical',
        components: {
          magicBlock: 'critical',
          lending: 'critical',
          solana: 'critical',
          ephemeralRollups: 'critical',
        },
        alerts: ['System health check failed'],
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Get metrics history for charts
   */
  getMetricsHistory(): DashboardMetrics[] {
    return this.metricsHistory;
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(): {
    latency: { timestamp: Date; value: number }[];
    throughput: { timestamp: Date; value: number }[];
    successRate: { timestamp: Date; value: number }[];
  } {
    const trends = {
      latency: [] as { timestamp: Date; value: number }[],
      throughput: [] as { timestamp: Date; value: number }[],
      successRate: [] as { timestamp: Date; value: number }[],
    };

    this.metricsHistory.forEach((metrics, index) => {
      const timestamp = new Date(Date.now() - (this.metricsHistory.length - index) * 60000); // 1 minute intervals
      
      trends.latency.push({
        timestamp,
        value: metrics.networkPerformance.averageLatency,
      });
      
      trends.throughput.push({
        timestamp,
        value: metrics.networkPerformance.throughput,
      });
      
      trends.successRate.push({
        timestamp,
        value: metrics.networkPerformance.successRate,
      });
    });

    return trends;
  }

  /**
   * Get real-time alerts
   */
  getRealTimeAlerts(): {
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }[] {
    const alerts = [];

    // Check for failed transactions
    const failedTransactions = Array.from(this.liveTransactions.values())
      .filter(tx => tx.status === 'failed')
      .slice(0, 5);

    failedTransactions.forEach(tx => {
      alerts.push({
        id: `failed_tx_${tx.id}`,
        type: 'error' as const,
        message: `Transaction ${tx.id} failed`,
        timestamp: tx.timestamp,
        resolved: false,
      });
    });

    // Check for high latency
    const highLatencyTransactions = Array.from(this.liveTransactions.values())
      .filter(tx => tx.latency && tx.latency > 1000)
      .slice(0, 3);

    highLatencyTransactions.forEach(tx => {
      alerts.push({
        id: `high_latency_${tx.id}`,
        type: 'warning' as const,
        message: `High latency detected: ${tx.latency}ms for transaction ${tx.id}`,
        timestamp: tx.timestamp,
        resolved: false,
      });
    });

    return alerts;
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      try {
        await this.getDashboardMetrics();
        this.logger.log('Metrics collected successfully');
      } catch (error) {
        this.logger.error('Failed to collect metrics', error);
      }
    }, 30000);
  }

  /**
   * Calculate transaction latency
   */
  private calculateLatency(tx: any): number {
    // Mock latency calculation
    return Math.floor(Math.random() * 50) + 5; // 5-55ms
  }

  /**
   * Calculate system throughput
   */
  private calculateThroughput(): number {
    // Mock throughput calculation (transactions per second)
    return Math.floor(Math.random() * 100) + 50; // 50-150 TPS
  }
}
