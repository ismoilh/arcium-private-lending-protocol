import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { LoanApplication } from '../entities/loan-application.entity';
import { LoanOffer } from '../entities/loan-offer.entity';
import { ActiveLoan } from '../entities/active-loan.entity';
import { LoanPayment } from '../entities/loan-payment.entity';
import { UserWallet } from '../entities/user-wallet.entity';
import { Token } from '../entities/token.entity';
import { TokenBalance } from '../entities/token-balance.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'password'),
        database: configService.get('DATABASE_NAME', 'arcium_lending'),
        entities: [
          User,
          LoanApplication,
          LoanOffer,
          ActiveLoan,
          LoanPayment,
          UserWallet,
          Token,
          TokenBalance,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      LoanApplication,
      LoanOffer,
      ActiveLoan,
      LoanPayment,
      UserWallet,
      Token,
      TokenBalance,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
