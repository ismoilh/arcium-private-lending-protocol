import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Arcium Private Lending API is running! 🔐';
  }

  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'arcium-private-lending',
      version: '1.0.0',
      features: [
        'encrypted-compute',
        'private-lending',
        'solana-integration',
        'secure-borrowing'
      ]
    };
  }
}
