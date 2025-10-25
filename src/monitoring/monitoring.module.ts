import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';
import { MetricsService } from './metrics.service';

@Module({
  imports: [ConfigModule],
  providers: [MonitoringService, LoggingService, MetricsService],
  exports: [MonitoringService, LoggingService, MetricsService],
})
export class MonitoringModule {}
