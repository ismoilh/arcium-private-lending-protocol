import { Injectable, Logger } from '@nestjs/common';
import {
  EncryptionService,
  LendingParams,
} from '../encryption/encryption.service';
import { SolanaService, LendingTransaction } from '../solana/solana.service';

export interface LoanApplication {
  id: string;
  borrowerId: string;
  amount: number;
  interestRate: number;
  duration: number;
  collateralRatio: number;
  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'active'
    | 'repaid'
    | 'defaulted';
  encryptedParams: any;
  riskAssessment?: {
    riskScore: number;
    approved: boolean;
    maxAmount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanOffer {
  id: string;
  lenderId: string;
  loanApplicationId: string;
  offeredAmount: number;
  offeredInterestRate: number;
  terms: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface ActiveLoan {
  id: string;
  loanApplicationId: string;
  borrowerId: string;
  lenderId: string;
  principalAmount: number;
  interestRate: number;
  remainingAmount: number;
  nextPaymentDate: Date;
  totalPayments: number;
  completedPayments: number;
  status: 'active' | 'repaid' | 'defaulted';
  createdAt: Date;
}

@Injectable()
export class LendingService {
  private readonly logger = new Logger(LendingService.name);
  private loanApplications: Map<string, LoanApplication> = new Map();
  private loanOffers: Map<string, LoanOffer> = new Map();
  private activeLoans: Map<string, ActiveLoan> = new Map();

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly solanaService: SolanaService
  ) {}

  /**
   * Submit a loan application with encrypted parameters
   */
  async submitLoanApplication(
    params: Omit<LendingParams, 'lenderId'>
  ): Promise<LoanApplication> {
    try {
      const applicationId = this.generateId();

      // Encrypt the lending parameters
      const encryptedParams =
        await this.encryptionService.encryptLendingParams(params);

      // Perform encrypted risk assessment
      const riskAssessment =
        await this.encryptionService.performEncryptedRiskAssessment(
          encryptedParams
        );

      const loanApplication: LoanApplication = {
        id: applicationId,
        borrowerId: params.borrowerId,
        amount: params.amount,
        interestRate: params.interestRate,
        duration: params.duration,
        collateralRatio: params.collateralRatio,
        status: riskAssessment.approved ? 'approved' : 'rejected',
        encryptedParams,
        riskAssessment,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.loanApplications.set(applicationId, loanApplication);

      this.logger.log(
        `Loan application submitted: ${applicationId}, Status: ${loanApplication.status}`
      );

      return loanApplication;
    } catch (error) {
      this.logger.error('Failed to submit loan application', error);
      throw new Error('Loan application submission failed');
    }
  }

  /**
   * Create a loan offer from a lender
   */
  async createLoanOffer(
    lenderId: string,
    loanApplicationId: string,
    offeredAmount: number,
    offeredInterestRate: number,
    terms: string,
    expiresInHours: number = 24
  ): Promise<LoanOffer> {
    try {
      const application = this.loanApplications.get(loanApplicationId);
      if (!application) {
        throw new Error('Loan application not found');
      }

      if (application.status !== 'approved') {
        throw new Error('Cannot create offer for non-approved application');
      }

      const offerId = this.generateId();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const loanOffer: LoanOffer = {
        id: offerId,
        lenderId,
        loanApplicationId,
        offeredAmount,
        offeredInterestRate,
        terms,
        status: 'pending',
        createdAt: new Date(),
        expiresAt,
      };

      this.loanOffers.set(offerId, loanOffer);

      this.logger.log(
        `Loan offer created: ${offerId} for application: ${loanApplicationId}`
      );

      return loanOffer;
    } catch (error) {
      this.logger.error('Failed to create loan offer', error);
      throw new Error('Loan offer creation failed');
    }
  }

  /**
   * Accept a loan offer and create an active loan
   */
  async acceptLoanOffer(
    offerId: string,
    borrowerId: string
  ): Promise<ActiveLoan> {
    try {
      const offer = this.loanOffers.get(offerId);
      if (!offer) {
        throw new Error('Loan offer not found');
      }

      if (offer.status !== 'pending') {
        throw new Error('Offer is no longer available');
      }

      if (new Date() > offer.expiresAt) {
        offer.status = 'expired';
        throw new Error('Offer has expired');
      }

      const application = this.loanApplications.get(offer.loanApplicationId);
      if (!application || application.borrowerId !== borrowerId) {
        throw new Error('Unauthorized or application not found');
      }

      // Create active loan
      const loanId = this.generateId();
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); // Monthly payments

      const activeLoan: ActiveLoan = {
        id: loanId,
        loanApplicationId: offer.loanApplicationId,
        borrowerId,
        lenderId: offer.lenderId,
        principalAmount: offer.offeredAmount,
        interestRate: offer.offeredInterestRate,
        remainingAmount: offer.offeredAmount,
        nextPaymentDate,
        totalPayments: application.duration / 30, // Assuming monthly payments
        completedPayments: 0,
        status: 'active',
        createdAt: new Date(),
      };

      this.activeLoans.set(loanId, activeLoan);

      // Update offer status
      offer.status = 'accepted';

      // Update application status
      application.status = 'active';
      application.updatedAt = new Date();

      this.logger.log(
        `Loan offer accepted: ${offerId}, Active loan created: ${loanId}`
      );

      return activeLoan;
    } catch (error) {
      this.logger.error('Failed to accept loan offer', error);
      throw new Error('Failed to accept loan offer');
    }
  }

  /**
   * Process a loan payment
   */
  async processLoanPayment(
    loanId: string,
    paymentAmount: number,
    borrowerSecretKey: string
  ): Promise<{ transaction: LendingTransaction; loan: ActiveLoan }> {
    try {
      const loan = this.activeLoans.get(loanId);
      if (!loan) {
        throw new Error('Active loan not found');
      }

      if (loan.status !== 'active') {
        throw new Error('Loan is not active');
      }

      // Calculate payment details
      const monthlyInterest = (loan.remainingAmount * loan.interestRate) / 12;
      const principalPayment = paymentAmount - monthlyInterest;
      const newRemainingAmount = Math.max(
        0,
        loan.remainingAmount - principalPayment
      );

      // Update loan
      loan.remainingAmount = newRemainingAmount;
      loan.completedPayments += 1;
      loan.nextPaymentDate = new Date();
      loan.nextPaymentDate.setMonth(loan.nextPaymentDate.getMonth() + 1);

      if (newRemainingAmount <= 0) {
        loan.status = 'repaid';
      }

      // In a real implementation, you would transfer tokens here
      // For now, we'll simulate the transaction
      const transaction: LendingTransaction = {
        signature: this.generateId(),
        from: 'borrower',
        to: 'lender',
        amount: paymentAmount,
        timestamp: new Date(),
      };

      this.logger.log(
        `Loan payment processed: ${loanId}, Amount: ${paymentAmount}`
      );

      return { transaction, loan };
    } catch (error) {
      this.logger.error('Failed to process loan payment', error);
      throw new Error('Loan payment processing failed');
    }
  }

  /**
   * Get loan applications for a borrower
   */
  async getBorrowerApplications(
    borrowerId: string
  ): Promise<LoanApplication[]> {
    const applications = Array.from(this.loanApplications.values())
      .filter((app) => app.borrowerId === borrowerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return applications;
  }

  /**
   * Get loan offers for a lender
   */
  async getLenderOffers(lenderId: string): Promise<LoanOffer[]> {
    const offers = Array.from(this.loanOffers.values())
      .filter((offer) => offer.lenderId === lenderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return offers;
  }

  /**
   * Get active loans for a user (borrower or lender)
   */
  async getUserActiveLoans(userId: string): Promise<ActiveLoan[]> {
    const loans = Array.from(this.activeLoans.values())
      .filter((loan) => loan.borrowerId === userId || loan.lenderId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return loans;
  }

  /**
   * Get all available loan applications for lenders to browse
   */
  async getAvailableLoanApplications(): Promise<LoanApplication[]> {
    const applications = Array.from(this.loanApplications.values())
      .filter((app) => app.status === 'approved')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return applications;
  }

  /**
   * Get loan application details (without sensitive encrypted data)
   */
  async getLoanApplicationDetails(
    applicationId: string
  ): Promise<Partial<LoanApplication>> {
    const application = this.loanApplications.get(applicationId);
    if (!application) {
      throw new Error('Loan application not found');
    }

    // Return application without encrypted params for security
    const { encryptedParams, ...publicDetails } = application;
    return publicDetails;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Get lending statistics
   */
  async getLendingStatistics(): Promise<{
    totalApplications: number;
    approvedApplications: number;
    activeLoans: number;
    totalLent: number;
    averageInterestRate: number;
  }> {
    const applications = Array.from(this.loanApplications.values());
    const loans = Array.from(this.activeLoans.values());

    const totalApplications = applications.length;
    const approvedApplications = applications.filter(
      (app) => app.status === 'approved'
    ).length;
    const activeLoansCount = loans.filter(
      (loan) => loan.status === 'active'
    ).length;
    const totalLent = loans.reduce(
      (sum, loan) => sum + loan.principalAmount,
      0
    );
    const averageInterestRate =
      loans.length > 0
        ? loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length
        : 0;

    return {
      totalApplications,
      approvedApplications,
      activeLoans: activeLoansCount,
      totalLent,
      averageInterestRate,
    };
  }
}
