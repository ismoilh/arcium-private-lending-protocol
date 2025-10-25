import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SolanaService } from './solana.service';

export class CreateWalletDto {
  // No body needed for wallet creation
}

export class TransferSOLDto {
  fromSecretKey: string;
  toPublicKey: string;
  amount: number;
}

export class TransferTokenDto {
  fromSecretKey: string;
  toPublicKey: string;
  mint: string;
  amount: number;
}

export class MintTokensDto {
  mint: string;
  toPublicKey: string;
  amount: number;
  payerSecretKey: string;
}

@ApiTags('solana')
@Controller('solana')
export class SolanaController {
  constructor(private readonly solanaService: SolanaService) {}

  @Post('create-wallet')
  @ApiOperation({ summary: 'Create a new Solana wallet' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  async createWallet() {
    return this.solanaService.createWallet();
  }

  @Get('wallet/:publicKey')
  @ApiOperation({ summary: 'Get wallet information' })
  @ApiResponse({ status: 200, description: 'Wallet information retrieved' })
  async getWalletInfo(@Param('publicKey') publicKey: string) {
    return this.solanaService.getWalletInfo(publicKey);
  }

  @Post('transfer-sol')
  @ApiOperation({ summary: 'Transfer SOL between wallets' })
  @ApiBody({ type: TransferSOLDto })
  @ApiResponse({ status: 200, description: 'SOL transferred successfully' })
  async transferSOL(@Body() transferData: TransferSOLDto) {
    const fromKeypair = this.solanaService['createKeypairFromSecret'](
      transferData.fromSecretKey
    );
    return this.solanaService.transferSOL(
      fromKeypair,
      transferData.toPublicKey,
      transferData.amount
    );
  }

  @Post('transfer-token')
  @ApiOperation({ summary: 'Transfer SPL tokens between wallets' })
  @ApiBody({ type: TransferTokenDto })
  @ApiResponse({ status: 200, description: 'Token transferred successfully' })
  async transferToken(@Body() transferData: TransferTokenDto) {
    const fromKeypair = this.solanaService['createKeypairFromSecret'](
      transferData.fromSecretKey
    );
    return this.solanaService.transferToken(
      fromKeypair,
      transferData.toPublicKey,
      transferData.mint,
      transferData.amount
    );
  }

  @Post('mint-tokens')
  @ApiOperation({ summary: 'Mint SPL tokens' })
  @ApiBody({ type: MintTokensDto })
  @ApiResponse({ status: 200, description: 'Tokens minted successfully' })
  async mintTokens(@Body() mintData: MintTokensDto) {
    const payerKeypair = this.solanaService['createKeypairFromSecret'](
      mintData.payerSecretKey
    );
    return this.solanaService.mintTokens(
      mintData.mint,
      mintData.toPublicKey,
      mintData.amount,
      payerKeypair
    );
  }

  @Get('transactions/:publicKey')
  @ApiOperation({ summary: 'Get transaction history for a wallet' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  async getTransactionHistory(
    @Param('publicKey') publicKey: string,
    @Query('limit') limit?: number
  ) {
    return this.solanaService.getTransactionHistory(publicKey, limit);
  }

  @Get('validate-address/:address')
  @ApiOperation({ summary: 'Validate a Solana address' })
  @ApiResponse({ status: 200, description: 'Address validation result' })
  async validateAddress(@Param('address') address: string) {
    return {
      address,
      isValid: this.solanaService.isValidAddress(address),
    };
  }

  @Get('sol-price')
  @ApiOperation({ summary: 'Get current SOL price' })
  @ApiResponse({ status: 200, description: 'SOL price retrieved' })
  async getSOLPrice() {
    const price = await this.solanaService.getSOLPrice();
    return { price, currency: 'USD' };
  }
}
