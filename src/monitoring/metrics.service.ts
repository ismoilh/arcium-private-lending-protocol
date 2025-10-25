import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
}

@Injectable()
export class MetricsService {
  private metrics: Map<string, MetricData[]> = new Map();
  private systemStartTime: Date = new Date();

  constructor(private configService: ConfigService) {}

  // Record a metric
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only last 1000 metrics per name
    if (metricArray.length > 1000) {
      metricArray.shift();
    }
  }

  // Get metrics for a specific name
  getMetrics(name: string, limit?: number): MetricData[] {
    const metricArray = this.metrics.get(name) || [];
    return limit ? metricArray.slice(-limit) : metricArray;
  }

  // Get all metrics
  getAllMetrics(): Map<string, MetricData[]> {
    return new Map(this.metrics);
  }

  // Get system metrics
  getSystemMetrics(): SystemMetrics {
    const uptime = Date.now() - this.systemStartTime.getTime();
    
    return {
      cpu: this.getCpuUsage(),
      memory: this.getMemoryUsage(),
      disk: this.getDiskUsage(),
      uptime: Math.floor(uptime / 1000), // in seconds
    };
  }

  // Get average metric value
  getAverageMetric(name: string, timeWindow?: number): number {
    const metricArray = this.metrics.get(name) || [];
    
    if (metricArray.length === 0) return 0;

    let filteredMetrics = metricArray;
    if (timeWindow) {
      const cutoffTime = new Date(Date.now() - timeWindow);
      filteredMetrics = metricArray.filter(m => m.timestamp >= cutoffTime);
    }

    if (filteredMetrics.length === 0) return 0;

    const sum = filteredMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / filteredMetrics.length;
  }

  // Get metric statistics
  getMetricStats(name: string, timeWindow?: number): {
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
  } {
    const metricArray = this.metrics.get(name) || [];
    
    let filteredMetrics = metricArray;
    if (timeWindow) {
      const cutoffTime = new Date(Date.now() - timeWindow);
      filteredMetrics = metricArray.filter(m => m.timestamp >= cutoffTime);
    }

    if (filteredMetrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, latest: 0 };
    }

    const values = filteredMetrics.map(m => m.value);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      count: filteredMetrics.length,
      average: sum / filteredMetrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1],
    };
  }

  // Business metrics
  recordLoanApplication(userId: string, amount: number) {
    this.recordMetric('loan_applications_total', 1, { userId });
    this.recordMetric('loan_application_amount', amount, { userId });
  }

  recordLoanApproval(loanId: string, amount: number) {
    this.recordMetric('loans_approved_total', 1, { loanId });
    this.recordMetric('loans_approved_amount', amount, { loanId });
  }

  recordLoanPayment(loanId: string, amount: number) {
    this.recordMetric('loan_payments_total', 1, { loanId });
    this.recordMetric('loan_payment_amount', amount, { loanId });
  }

  recordUserRegistration(userId: string, role: string) {
    this.recordMetric('user_registrations_total', 1, { userId, role });
  }

  recordUserLogin(userId: string) {
    this.recordMetric('user_logins_total', 1, { userId });
  }

  recordEncryptionOperation(operation: string, duration: number) {
    this.recordMetric('encryption_operations_total', 1, { operation });
    this.recordMetric('encryption_duration_ms', duration, { operation });
  }

  recordSolanaTransaction(type: string, success: boolean, duration: number) {
    this.recordMetric('solana_transactions_total', 1, { type, success: success.toString() });
    this.recordMetric('solana_transaction_duration_ms', duration, { type });
  }

  recordRiskAssessment(score: number, approved: boolean, duration: number) {
    this.recordMetric('risk_assessments_total', 1, { approved: approved.toString() });
    this.recordMetric('risk_score', score, { approved: approved.toString() });
    this.recordMetric('risk_assessment_duration_ms', duration);
  }

  // System health metrics
  private getCpuUsage(): number {
    // Simplified CPU usage calculation
    // In production, use a proper system monitoring library
    return Math.random() * 100;
  }

  private getMemoryUsage(): number {
    const used = process.memoryUsage();
    return (used.heapUsed / used.heapTotal) * 100;
  }

  private getDiskUsage(): number {
    // Simplified disk usage calculation
    // In production, use a proper system monitoring library
    return Math.random() * 100;
  }

  // Get dashboard data
  getDashboardData() {
    const now = new Date();
    const last24Hours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    return {
      system: this.getSystemMetrics(),
      loans: {
        applications: this.getMetricStats('loan_applications_total', last24Hours),
        approvals: this.getMetricStats('loans_approved_total', last24Hours),
        payments: this.getMetricStats('loan_payments_total', last24Hours),
      },
      users: {
        registrations: this.getMetricStats('user_registrations_total', last24Hours),
        logins: this.getMetricStats('user_logins_total', last24Hours),
      },
      performance: {
        encryption: this.getMetricStats('encryption_duration_ms', last24Hours),
        solana: this.getMetricStats('solana_transaction_duration_ms', last24Hours),
        riskAssessment: this.getMetricStats('risk_assessment_duration_ms', last24Hours),
      },
    };
  }
}
