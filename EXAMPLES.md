# Arcium Private Lending Protocol - Usage Examples

This document provides comprehensive examples of how to use the Arcium Private Lending Protocol API.

## 🚀 Quick Start

### 1. Start the Server

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000` with Swagger documentation at `http://localhost:3000/api`.

## 📝 API Usage Examples

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "arcium-private-lending",
  "version": "1.0.0",
  "features": [
    "encrypted-compute",
    "private-lending",
    "solana-integration",
    "secure-borrowing"
  ]
}
```

### 2. Create Solana Wallets

```bash
# Create borrower wallet
curl -X POST http://localhost:3000/solana/create-wallet

# Create lender wallet  
curl -X POST http://localhost:3000/solana/create-wallet
```

Response:
```json
{
  "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "secretKey": "base64-encoded-secret-key"
}
```

### 3. Submit Loan Application

```bash
curl -X POST http://localhost:3000/lending/submit-application \
  -H "Content-Type: application/json" \
  -d '{
    "borrowerId": "borrower_001",
    "amount": 50000,
    "interestRate": 0.08,
    "duration": 180,
    "collateralRatio": 2.0
  }'
```

Response:
```json
{
  "id": "app_123456789",
  "borrowerId": "borrower_001",
  "amount": 50000,
  "interestRate": 0.08,
  "duration": 180,
  "collateralRatio": 2.0,
  "status": "approved",
  "riskAssessment": {
    "riskScore": 35,
    "approved": true,
    "maxAmount": 60000
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 4. Encrypt Lending Parameters

```bash
curl -X POST http://localhost:3000/encryption/encrypt-lending-params \
  -H "Content-Type: application/json" \
  -d '{
    "borrowerId": "borrower_001",
    "amount": 30000,
    "interestRate": 0.07,
    "duration": 90,
    "collateralRatio": 1.8
  }'
```

Response:
```json
{
  "data": "encrypted-data-string",
  "key": "encryption-key-hex",
  "iv": "initialization-vector-hex",
  "algorithm": "aes-256-gcm"
}
```

### 5. Perform Risk Assessment

```bash
curl -X POST http://localhost:3000/encryption/risk-assessment \
  -H "Content-Type: application/json" \
  -d '{
    "data": "encrypted-data-string",
    "key": "encryption-key-hex",
    "iv": "initialization-vector-hex",
    "algorithm": "aes-256-gcm"
  }'
```

Response:
```json
{
  "riskScore": 28,
  "approved": true,
  "maxAmount": 75000
}
```

### 6. Create Loan Offer

```bash
curl -X POST http://localhost:3000/lending/create-offer \
  -H "Content-Type: application/json" \
  -d '{
    "lenderId": "lender_001",
    "loanApplicationId": "app_123456789",
    "offeredAmount": 45000,
    "offeredInterestRate": 0.075,
    "terms": "Monthly payments, 6-month term",
    "expiresInHours": 24
  }'
```

Response:
```json
{
  "id": "offer_987654321",
  "lenderId": "lender_001",
  "loanApplicationId": "app_123456789",
  "offeredAmount": 45000,
  "offeredInterestRate": 0.075,
  "terms": "Monthly payments, 6-month term",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-01-16T10:30:00.000Z"
}
```

### 7. Accept Loan Offer

```bash
curl -X POST http://localhost:3000/lending/accept-offer \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "offer_987654321",
    "borrowerId": "borrower_001"
  }'
```

Response:
```json
{
  "id": "loan_456789123",
  "loanApplicationId": "app_123456789",
  "borrowerId": "borrower_001",
  "lenderId": "lender_001",
  "principalAmount": 45000,
  "interestRate": 0.075,
  "remainingAmount": 45000,
  "nextPaymentDate": "2024-02-15T10:30:00.000Z",
  "totalPayments": 6,
  "completedPayments": 0,
  "status": "active",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### 8. Process Loan Payment

```bash
curl -X POST http://localhost:3000/lending/process-payment \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": "loan_456789123",
    "paymentAmount": 8000,
    "borrowerSecretKey": "base64-encoded-secret-key"
  }'
```

Response:
```json
{
  "transaction": {
    "signature": "tx_789123456",
    "from": "borrower",
    "to": "lender",
    "amount": 8000,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "loan": {
    "id": "loan_456789123",
    "remainingAmount": 37000,
    "completedPayments": 1,
    "status": "active"
  }
}
```

## 🔍 Query Examples

### Get Borrower Applications

```bash
curl http://localhost:3000/lending/applications/borrower/borrower_001
```

### Get Lender Offers

```bash
curl http://localhost:3000/lending/offers/lender/lender_001
```

### Get User Active Loans

```bash
curl http://localhost:3000/lending/loans/user/borrower_001
```

### Get Available Applications

```bash
curl http://localhost:3000/lending/applications/available
```

### Get Platform Statistics

```bash
curl http://localhost:3000/lending/statistics
```

Response:
```json
{
  "totalApplications": 15,
  "approvedApplications": 12,
  "activeLoans": 8,
  "totalLent": 450000,
  "averageInterestRate": 0.075
}
```

## 🔐 Security Features

### Encrypted Data Flow

1. **Parameter Encryption**: All sensitive lending parameters are encrypted using AES-256-GCM
2. **Risk Assessment**: Risk evaluation happens on encrypted data without exposing raw values
3. **Secure Storage**: Encrypted parameters are stored securely
4. **Transaction Integrity**: All transactions are cryptographically verified

### Privacy Protection

- Borrower and lender identities are protected
- Loan terms remain confidential until execution
- Financial data is encrypted at rest and in transit
- Risk assessment results are computed without exposing input data

## 🎯 Use Cases

### 1. Private Lending Platform

```javascript
// Complete lending flow example
async function privateLendingFlow() {
  // 1. Create wallets
  const borrowerWallet = await createWallet();
  const lenderWallet = await createWallet();
  
  // 2. Submit loan application
  const application = await submitLoanApplication({
    borrowerId: 'borrower_001',
    amount: 50000,
    interestRate: 0.08,
    duration: 180,
    collateralRatio: 2.0
  });
  
  // 3. Create and accept offer
  const offer = await createLoanOffer({
    lenderId: 'lender_001',
    loanApplicationId: application.id,
    offeredAmount: 45000,
    offeredInterestRate: 0.075,
    terms: 'Monthly payments'
  });
  
  const activeLoan = await acceptLoanOffer({
    offerId: offer.id,
    borrowerId: 'borrower_001'
  });
  
  // 4. Process payments
  await processPayment({
    loanId: activeLoan.id,
    paymentAmount: 8000,
    borrowerSecretKey: borrowerWallet.secretKey
  });
}
```

### 2. Institutional Trading

```javascript
// Large institution trading without exposing positions
async function institutionalTrading() {
  // Encrypt large trade parameters
  const encryptedTrade = await encryptLendingParams({
    borrowerId: 'institution_001',
    amount: 1000000, // $1M trade
    interestRate: 0.05,
    duration: 30,
    collateralRatio: 3.0
  });
  
  // Perform encrypted risk assessment
  const riskResult = await performRiskAssessment(encryptedTrade);
  
  // Execute trade if approved
  if (riskResult.approved) {
    // Trade execution logic
  }
}
```

### 3. Cross-border Lending

```javascript
// International lending with privacy protection
async function crossBorderLending() {
  const internationalLoan = await submitLoanApplication({
    borrowerId: 'international_borrower',
    amount: 100000,
    interestRate: 0.12, // Higher rate for international
    duration: 365,
    collateralRatio: 2.5
  });
  
  // Encrypted compliance checks
  const complianceCheck = await performEncryptedComputation({
    functionName: 'complianceValidation',
    encryptedInputs: [encryptedLoanParams],
    metadata: { country: 'US', borrowerCountry: 'UK' }
  });
}
```

## 🛠 Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
npm run start:prod
```

### Code Quality

```bash
npm run lint
npm run format
```

## 📚 Additional Resources

- [API Documentation](http://localhost:3000/api) - Interactive Swagger documentation
- [README.md](./README.md) - Project overview and setup
- [Arcium Documentation](https://docs.arcium.com) - Arcium encrypted compute docs
- [Solana Documentation](https://docs.solana.com) - Solana blockchain docs

## 🤝 Support

For questions and support:
- Open an issue on GitHub
- Contact the development team
- Check the API documentation at `/api`
