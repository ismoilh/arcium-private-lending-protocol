import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LendingModule } from './lending/lending.module';
import { EncryptionModule } from './encryption/encryption.module';
import { SolanaModule } from './solana/solana.module';
import { ArciumModule } from './arcium/arcium.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { RiskModule } from './risk/risk.module';
import { LiquidationModule } from './liquidation/liquidation.module';
import { GovernanceModule } from './governance/governance.module';
import { MagicBlockModule } from './magicblock/magicblock.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    DatabaseModule,
    AuthModule,
    MonitoringModule,
    LendingModule,
    EncryptionModule,
    SolanaModule,
    ArciumModule,
    RiskModule,
    LiquidationModule,
    GovernanceModule,
    MagicBlockModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
