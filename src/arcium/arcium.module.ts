import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArciumIntegrationService } from './arcium-integration.service';
import { ArciumAPIService } from './arcium-api.service';
import { ArciumRealService } from './arcium-real.service';
import { ArciumController } from './arcium.controller';
import { ArciumAPIController } from './arcium-api.controller';
import { ArciumRealController } from './arcium-real.controller';

@Module({
  imports: [ConfigModule],
  providers: [ArciumIntegrationService, ArciumAPIService, ArciumRealService],
  controllers: [ArciumController, ArciumAPIController, ArciumRealController],
  exports: [ArciumIntegrationService, ArciumAPIService, ArciumRealService],
})
export class ArciumModule {}
