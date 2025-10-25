import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingService implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.logger = winston.createLogger({
      level: this.configService.get('LOG_LEVEL', 'info'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        // File transport for errors
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
        }),
        // File transport for all logs
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom logging methods for business events
  logUserAction(userId: string, action: string, details?: any) {
    this.logger.info('User action', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  logLoanEvent(loanId: string, event: string, details?: any) {
    this.logger.info('Loan event', {
      loanId,
      event,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  logSecurityEvent(event: string, details?: any) {
    this.logger.warn('Security event', {
      event,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  logPerformance(operation: string, duration: number, details?: any) {
    this.logger.info('Performance metric', {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
