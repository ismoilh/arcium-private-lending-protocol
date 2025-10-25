/**
 * Demo script for Arcium Private Lending Protocol
 * This script demonstrates the key features of the lending platform
 */

const API_BASE = 'http://localhost:3000';

// Demo data
const demoBorrower = {
  id: 'borrower_001',
  name: 'Alice Johnson',
  creditScore: 750
};

const demoLender = {
  id: 'lender_001', 
  name: 'Bob Smith',
  availableFunds: 100000
};

async function makeRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log(`✅ ${method} ${endpoint}:`, result);
    return result;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint}:`, error.message);
    return null;
  }
}

async function runDemo() {
  console.log('🔐 Arcium Private Lending Protocol Demo\n');
  console.log('=====================================\n');

  // 1. Health Check
  console.log('1. 🏥 Health Check');
  await makeRequest('/health');
  console.log('');

  // 2. Create Wallets
  console.log('2. 💳 Creating Wallets');
  const borrowerWallet = await makeRequest('/solana/create-wallet', 'POST');
  const lenderWallet = await makeRequest('/solana/create-wallet', 'POST');
  console.log('');

  // 3. Submit Loan Application
  console.log('3. 📝 Submitting Loan Application');
  const loanApplication = await makeRequest('/lending/submit-application', 'POST', {
    borrowerId: demoBorrower.id,
    amount: 50000,
    interestRate: 0.08,
    duration: 180, // 6 months
    collateralRatio: 2.0
  });
  console.log('');

  // 4. Encrypt Lending Parameters
  console.log('4. 🔐 Encrypting Lending Parameters');
  const encryptedParams = await makeRequest('/encryption/encrypt-lending-params', 'POST', {
    borrowerId: demoBorrower.id,
    amount: 30000,
    interestRate: 0.07,
    duration: 90,
    collateralRatio: 1.8
  });
  console.log('');

  // 5. Perform Risk Assessment
  console.log('5. 🧮 Performing Encrypted Risk Assessment');
  const riskAssessment = await makeRequest('/encryption/risk-assessment', 'POST', encryptedParams);
  console.log('');

  // 6. Create Loan Offer
  if (loanApplication && loanApplication.status === 'approved') {
    console.log('6. 💰 Creating Loan Offer');
    const loanOffer = await makeRequest('/lending/create-offer', 'POST', {
      lenderId: demoLender.id,
      loanApplicationId: loanApplication.id,
      offeredAmount: 45000,
      offeredInterestRate: 0.075,
      terms: 'Monthly payments, 6-month term',
      expiresInHours: 24
    });
    console.log('');

    // 7. Accept Loan Offer
    if (loanOffer) {
      console.log('7. ✅ Accepting Loan Offer');
      const activeLoan = await makeRequest('/lending/accept-offer', 'POST', {
        offerId: loanOffer.id,
        borrowerId: demoBorrower.id
      });
      console.log('');

      // 8. Process Payment
      if (activeLoan) {
        console.log('8. 💸 Processing Loan Payment');
        const payment = await makeRequest('/lending/process-payment', 'POST', {
          loanId: activeLoan.id,
          paymentAmount: 8000,
          borrowerSecretKey: borrowerWallet?.secretKey || 'demo-key'
        });
        console.log('');
      }
    }
  }

  // 9. Get Statistics
  console.log('9. 📊 Platform Statistics');
  await makeRequest('/lending/statistics');
  console.log('');

  // 10. Get Available Applications
  console.log('10. 📋 Available Loan Applications');
  await makeRequest('/lending/applications/available');
  console.log('');

  console.log('🎉 Demo completed!');
  console.log('\nKey Features Demonstrated:');
  console.log('• Encrypted parameter storage');
  console.log('• Private risk assessment');
  console.log('• Secure loan processing');
  console.log('• Solana wallet integration');
  console.log('• RESTful API with Swagger docs');
}

// Run the demo
runDemo().catch(console.error);
