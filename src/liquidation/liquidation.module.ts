import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiquidationService } from './liquidation.service';
import { LiquidationController } from './liquidation.controller';
import { ActiveLoan } from '../entities/active-loan.entity';
import { User } from '../entities/user.entity';
import { SolanaModule } from '../solana/solana.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActiveLoan, User]),
    SolanaModule,
    MonitoringModule,
  ],
  providers: [LiquidationService],
  controllers: [LiquidationController],
  exports: [LiquidationService],
})
export class LiquidationModule {}
