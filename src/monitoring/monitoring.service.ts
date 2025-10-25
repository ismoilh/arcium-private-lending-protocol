import { Injectable } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class MonitoringService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly metricsService: MetricsService,
  ) {}

  // Health check
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    services: {
      database: string;
      solana: string;
      encryption: string;
    };
  }> {
    const uptime = process.uptime();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      version: '1.0.0',
      services: {
        database: 'healthy', // In production, check actual DB connection
        solana: 'healthy',   // In production, check Solana RPC
        encryption: 'healthy', // In production, check encryption service
      },
    };
  }

  // Performance monitoring
  async recordPerformance(operation: string, startTime: number, details?: any) {
    const duration = Date.now() - startTime;
    
    this.loggingService.logPerformance(operation, duration, details);
    this.metricsService.recordMetric('operation_duration_ms', duration, { operation });
  }

  // Error tracking
  async recordError(error: Error, context?: string, details?: any) {
    this.loggingService.error(error.message, error.stack, context);
    this.metricsService.recordMetric('errors_total', 1, { 
      error: error.name,
      context: context || 'unknown',
    });
  }

  // Business event tracking
  async trackUserAction(userId: string, action: string, details?: any) {
    this.loggingService.logUserAction(userId, action, details);
    this.metricsService.recordUserLogin(userId); // Adjust based on action
  }

  async trackLoanEvent(loanId: string, event: string, details?: any) {
    this.loggingService.logLoanEvent(loanId, event, details);
    
    switch (event) {
      case 'application_created':
        this.metricsService.recordLoanApplication(loanId, details?.amount || 0);
        break;
      case 'loan_approved':
        this.metricsService.recordLoanApproval(loanId, details?.amount || 0);
        break;
      case 'payment_received':
        this.metricsService.recordLoanPayment(loanId, details?.amount || 0);
        break;
    }
  }

  // Security monitoring
  async trackSecurityEvent(event: string, details?: any) {
    this.loggingService.logSecurityEvent(event, details);
    this.metricsService.recordMetric('security_events_total', 1, { event });
  }

  // Get monitoring dashboard data
  async getDashboardData() {
    return this.metricsService.getDashboardData();
  }

  // Get system alerts
  async getAlerts(): Promise<Array<{
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>> {
    // In production, implement actual alerting logic
    return [
      {
        level: 'info',
        message: 'System running normally',
        timestamp: new Date().toISOString(),
        resolved: true,
      },
    ];
  }
}
