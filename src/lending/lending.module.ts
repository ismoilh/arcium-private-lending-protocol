import { Module } from '@nestjs/common';
import { LendingService } from './lending.service';
import { LendingController } from './lending.controller';
import { EncryptionModule } from '../encryption/encryption.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [EncryptionModule, SolanaModule],
  providers: [LendingService],
  controllers: [LendingController],
})
export class LendingModule {}
