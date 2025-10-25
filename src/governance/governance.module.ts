import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceService } from './governance.service';
import { GovernanceController } from './governance.controller';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [GovernanceService],
  controllers: [GovernanceController],
  exports: [GovernanceService],
})
export class GovernanceModule {}
