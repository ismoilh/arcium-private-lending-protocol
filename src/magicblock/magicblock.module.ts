import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MagicBlockService } from './magicblock.service';
import { MagicBlockController } from './magicblock.controller';
import { MagicRouterService } from './magic-router.service';
import { RealtimeDashboardService } from './realtime-dashboard.service';
import { DashboardController } from './dashboard.controller';
import { SolanaModule } from '../solana/solana.module';
import { LendingModule } from '../lending/lending.module';

@Module({
  imports: [ConfigModule, SolanaModule, LendingModule],
  providers: [MagicBlockService, MagicRouterService, RealtimeDashboardService],
  controllers: [MagicBlockController, DashboardController],
  exports: [MagicBlockService, MagicRouterService, RealtimeDashboardService],
})
export class MagicBlockModule {}
