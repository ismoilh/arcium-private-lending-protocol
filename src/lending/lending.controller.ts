import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  LendingService,
  LoanApplication,
  LoanOffer,
  ActiveLoan,
} from './lending.service';

export class SubmitLoanApplicationDto {
  borrowerId: string;
  amount: number;
  interestRate: number;
  duration: number;
  collateralRatio: number;
}

export class CreateLoanOfferDto {
  lenderId: string;
  loanApplicationId: string;
  offeredAmount: number;
  offeredInterestRate: number;
  terms: string;
  expiresInHours?: number;
}

export class AcceptLoanOfferDto {
  offerId: string;
  borrowerId: string;
}

export class ProcessPaymentDto {
  loanId: string;
  paymentAmount: number;
  borrowerSecretKey: string;
}

@ApiTags('lending')
@Controller('lending')
export class LendingController {
  constructor(private readonly lendingService: LendingService) {}

  @Post('submit-application')
  @ApiOperation({
    summary: 'Submit a loan application with encrypted parameters',
  })
  @ApiBody({ type: SubmitLoanApplicationDto })
  @ApiResponse({
    status: 201,
    description: 'Loan application submitted successfully',
  })
  async submitLoanApplication(
    @Body() params: SubmitLoanApplicationDto
  ): Promise<LoanApplication> {
    return this.lendingService.submitLoanApplication(params);
  }

  @Post('create-offer')
  @ApiOperation({ summary: 'Create a loan offer from a lender' })
  @ApiBody({ type: CreateLoanOfferDto })
  @ApiResponse({ status: 201, description: 'Loan offer created successfully' })
  async createLoanOffer(
    @Body() offerData: CreateLoanOfferDto
  ): Promise<LoanOffer> {
    return this.lendingService.createLoanOffer(
      offerData.lenderId,
      offerData.loanApplicationId,
      offerData.offeredAmount,
      offerData.offeredInterestRate,
      offerData.terms,
      offerData.expiresInHours
    );
  }

  @Post('accept-offer')
  @ApiOperation({ summary: 'Accept a loan offer and create active loan' })
  @ApiBody({ type: AcceptLoanOfferDto })
  @ApiResponse({ status: 200, description: 'Loan offer accepted successfully' })
  async acceptLoanOffer(
    @Body() acceptData: AcceptLoanOfferDto
  ): Promise<ActiveLoan> {
    return this.lendingService.acceptLoanOffer(
      acceptData.offerId,
      acceptData.borrowerId
    );
  }

  @Post('process-payment')
  @ApiOperation({ summary: 'Process a loan payment' })
  @ApiBody({ type: ProcessPaymentDto })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processLoanPayment(@Body() paymentData: ProcessPaymentDto) {
    return this.lendingService.processLoanPayment(
      paymentData.loanId,
      paymentData.paymentAmount,
      paymentData.borrowerSecretKey
    );
  }

  @Get('applications/borrower/:borrowerId')
  @ApiOperation({ summary: 'Get loan applications for a borrower' })
  @ApiResponse({ status: 200, description: 'Borrower applications retrieved' })
  async getBorrowerApplications(
    @Param('borrowerId') borrowerId: string
  ): Promise<LoanApplication[]> {
    return this.lendingService.getBorrowerApplications(borrowerId);
  }

  @Get('offers/lender/:lenderId')
  @ApiOperation({ summary: 'Get loan offers for a lender' })
  @ApiResponse({ status: 200, description: 'Lender offers retrieved' })
  async getLenderOffers(
    @Param('lenderId') lenderId: string
  ): Promise<LoanOffer[]> {
    return this.lendingService.getLenderOffers(lenderId);
  }

  @Get('loans/user/:userId')
  @ApiOperation({ summary: 'Get active loans for a user' })
  @ApiResponse({ status: 200, description: 'User loans retrieved' })
  async getUserActiveLoans(
    @Param('userId') userId: string
  ): Promise<ActiveLoan[]> {
    return this.lendingService.getUserActiveLoans(userId);
  }

  @Get('applications/available')
  @ApiOperation({ summary: 'Get available loan applications for lenders' })
  @ApiResponse({ status: 200, description: 'Available applications retrieved' })
  async getAvailableLoanApplications(): Promise<LoanApplication[]> {
    return this.lendingService.getAvailableLoanApplications();
  }

  @Get('applications/:applicationId')
  @ApiOperation({ summary: 'Get loan application details' })
  @ApiResponse({ status: 200, description: 'Application details retrieved' })
  async getLoanApplicationDetails(
    @Param('applicationId') applicationId: string
  ) {
    return this.lendingService.getLoanApplicationDetails(applicationId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get lending platform statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getLendingStatistics() {
    return this.lendingService.getLendingStatistics();
  }
}
