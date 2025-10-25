import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LendingModule } from './lending/lending.module';
import { EncryptionModule } from './encryption/encryption.module';
import { SolanaModule } from './solana/solana.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    LendingModule,
    EncryptionModule,
    SolanaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
