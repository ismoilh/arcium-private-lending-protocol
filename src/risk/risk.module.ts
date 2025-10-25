import { Module } from '@nestjs/common';
import { RiskAssessmentService } from './risk-assessment.service';
import { RiskController } from './risk.controller';

@Module({
  providers: [RiskAssessmentService],
  controllers: [RiskController],
  exports: [RiskAssessmentService],
})
export class RiskModule {}
