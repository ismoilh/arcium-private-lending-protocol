import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EncryptionService, EncryptedData, LendingParams } from './encryption.service';

export class EncryptLendingParamsDto {
  amount: number;
  interestRate: number;
  duration: number;
  collateralRatio: number;
  borrowerId: string;
  lenderId?: string;
}

export class DecryptDataDto {
  data: string;
  key: string;
  iv: string;
  algorithm: string;
}

@ApiTags('encryption')
@Controller('encryption')
export class EncryptionController {
  constructor(private readonly encryptionService: EncryptionService) {}

  @Post('encrypt-lending-params')
  @ApiOperation({ summary: 'Encrypt lending parameters' })
  @ApiBody({ type: EncryptLendingParamsDto })
  @ApiResponse({ status: 201, description: 'Parameters encrypted successfully' })
  async encryptLendingParams(@Body() params: EncryptLendingParamsDto): Promise<EncryptedData> {
    return this.encryptionService.encryptLendingParams(params);
  }

  @Post('decrypt-lending-params')
  @ApiOperation({ summary: 'Decrypt lending parameters' })
  @ApiBody({ type: DecryptDataDto })
  @ApiResponse({ status: 200, description: 'Parameters decrypted successfully' })
  async decryptLendingParams(@Body() encryptedData: DecryptDataDto): Promise<LendingParams> {
    return this.encryptionService.decryptLendingParams(encryptedData);
  }

  @Post('encrypt-user-data')
  @ApiOperation({ summary: 'Encrypt user financial data' })
  @ApiResponse({ status: 201, description: 'User data encrypted successfully' })
  async encryptUserData(@Body() userData: any): Promise<EncryptedData> {
    return this.encryptionService.encryptUserData(userData);
  }

  @Post('decrypt-user-data')
  @ApiOperation({ summary: 'Decrypt user financial data' })
  @ApiBody({ type: DecryptDataDto })
  @ApiResponse({ status: 200, description: 'User data decrypted successfully' })
  async decryptUserData(@Body() encryptedData: DecryptDataDto): Promise<any> {
    return this.encryptionService.decryptUserData(encryptedData);
  }

  @Post('risk-assessment')
  @ApiOperation({ summary: 'Perform encrypted risk assessment' })
  @ApiBody({ type: DecryptDataDto })
  @ApiResponse({ status: 200, description: 'Risk assessment completed' })
  async performRiskAssessment(@Body() encryptedParams: DecryptDataDto) {
    return this.encryptionService.performEncryptedRiskAssessment(encryptedParams);
  }

  @Get('generate-hash')
  @ApiOperation({ summary: 'Generate transaction hash' })
  @ApiResponse({ status: 200, description: 'Hash generated successfully' })
  async generateHash(@Body() data: any): Promise<{ hash: string }> {
    const hash = this.encryptionService.generateTransactionHash(data);
    return { hash };
  }
}
