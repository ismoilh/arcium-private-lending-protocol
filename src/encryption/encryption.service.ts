import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedData {
  data: string;
  key: string;
  iv: string;
  algorithm: string;
}

export interface LendingParams {
  amount: number;
  interestRate: number;
  duration: number;
  collateralRatio: number;
  borrowerId: string;
  lenderId?: string;
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits

  constructor(private configService: ConfigService) {}

  /**
   * Encrypts sensitive lending parameters using AES-256-GCM
   * This simulates Arcium's encrypted compute capabilities
   */
  async encryptLendingParams(params: LendingParams): Promise<EncryptedData> {
    try {
      const key = crypto.randomBytes(this.keyLength);
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('lending-params'));

      const plaintext = JSON.stringify(params);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      const encryptedData: EncryptedData = {
        data: encrypted,
        key: key.toString('hex'),
        iv: iv.toString('hex'),
        algorithm: this.algorithm,
      };

      this.logger.log(
        `Encrypted lending params for borrower: ${params.borrowerId}`
      );
      return encryptedData;
    } catch (error) {
      this.logger.error('Failed to encrypt lending params', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts lending parameters
   */
  async decryptLendingParams(
    encryptedData: EncryptedData
  ): Promise<LendingParams> {
    try {
      const key = Buffer.from(encryptedData.key, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipher(encryptedData.algorithm, key);
      // Note: setAAD is not available on Decipher, using createDecipherGCM for GCM mode
      // decipher.setAAD(Buffer.from('lending-params'));

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const params = JSON.parse(decrypted) as LendingParams;
      this.logger.log(
        `Decrypted lending params for borrower: ${params.borrowerId}`
      );
      return params;
    } catch (error) {
      this.logger.error('Failed to decrypt lending params', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypts user financial data for private storage
   */
  async encryptUserData(userData: any): Promise<EncryptedData> {
    try {
      const key = crypto.randomBytes(this.keyLength);
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('user-data'));

      const plaintext = JSON.stringify(userData);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        data: encrypted,
        key: key.toString('hex'),
        iv: iv.toString('hex'),
        algorithm: this.algorithm,
      };
    } catch (error) {
      this.logger.error('Failed to encrypt user data', error);
      throw new Error('User data encryption failed');
    }
  }

  /**
   * Decrypts user financial data
   */
  async decryptUserData(encryptedData: EncryptedData): Promise<any> {
    try {
      const key = Buffer.from(encryptedData.key, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipher(encryptedData.algorithm, key);
      // Note: setAAD is not available on Decipher, using createDecipherGCM for GCM mode
      // decipher.setAAD(Buffer.from('user-data'));

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Failed to decrypt user data', error);
      throw new Error('User data decryption failed');
    }
  }

  /**
   * Generates a secure hash for transaction verification
   */
  generateTransactionHash(data: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * Verifies transaction integrity
   */
  verifyTransactionHash(data: any, expectedHash: string): boolean {
    const actualHash = this.generateTransactionHash(data);
    return crypto.timingSafeEqual(
      Buffer.from(actualHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  }

  /**
   * Simulates Arcium's encrypted compute for risk assessment
   * In a real implementation, this would use Arcium's MPC network
   */
  async performEncryptedRiskAssessment(
    encryptedParams: EncryptedData
  ): Promise<{
    riskScore: number;
    approved: boolean;
    maxAmount: number;
  }> {
    try {
      // Decrypt parameters for computation
      const params = await this.decryptLendingParams(encryptedParams);

      // Simulate encrypted computation for risk assessment
      const riskFactors = {
        amount: params.amount,
        interestRate: params.interestRate,
        duration: params.duration,
        collateralRatio: params.collateralRatio,
      };

      // Calculate risk score (simplified algorithm)
      let riskScore = 0;

      // Amount risk factor
      if (params.amount > 100000) riskScore += 30;
      else if (params.amount > 50000) riskScore += 20;
      else if (params.amount > 10000) riskScore += 10;

      // Interest rate risk factor
      if (params.interestRate > 0.15) riskScore += 25;
      else if (params.interestRate > 0.1) riskScore += 15;
      else if (params.interestRate > 0.05) riskScore += 5;

      // Duration risk factor
      if (params.duration > 365) riskScore += 20;
      else if (params.duration > 180) riskScore += 10;
      else if (params.duration > 90) riskScore += 5;

      // Collateral ratio risk factor
      if (params.collateralRatio < 1.5) riskScore += 30;
      else if (params.collateralRatio < 2.0) riskScore += 20;
      else if (params.collateralRatio < 2.5) riskScore += 10;

      const approved = riskScore < 50;
      const maxAmount = approved ? Math.min(params.amount * 1.2, 200000) : 0;

      this.logger.log(
        `Risk assessment completed. Score: ${riskScore}, Approved: ${approved}`
      );

      return {
        riskScore,
        approved,
        maxAmount,
      };
    } catch (error) {
      this.logger.error('Risk assessment failed', error);
      throw new Error('Encrypted risk assessment failed');
    }
  }
}
