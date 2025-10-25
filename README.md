# Arcium Private Lending Protocol

A private lending and borrowing protocol built with NestJS that integrates Arcium's encrypted compute capabilities for secure financial transactions on Solana.

## 🔐 Features

### Core Features
- **Encrypted Compute Integration**: Leverages Arcium's MPC network for secure parameter processing
- **Private Lending**: Borrow and lend with encrypted sensitive data
- **Solana Integration**: Built on Solana blockchain for fast, low-cost transactions
- **MagicBlock Ephemeral Rollups**: Real-time sub-10ms transaction processing
- **Gasless Transactions**: Zero-fee transactions through Ephemeral Rollups
- **Intelligent Routing**: Automatic routing between Solana and Ephemeral Rollups
- **Risk Assessment**: Advanced ML-powered risk evaluation using encrypted compute
- **Secure Transactions**: All sensitive data is encrypted using AES-256-GCM
- **RESTful API**: Complete API documentation with Swagger
- **TypeScript**: Fully typed codebase for better development experience

### Advanced Features
- **Database Persistence**: PostgreSQL with TypeORM for robust data management
- **User Authentication**: JWT-based authentication with role-based access control
- **Advanced Risk Models**: Machine learning-powered risk assessment with multiple factors
- **Multi-Token Support**: Support for multiple SPL tokens and token management
- **Automated Liquidation**: Smart liquidation system for undercollateralized loans
- **Governance System**: Decentralized governance for protocol parameter management
- **Comprehensive Monitoring**: Real-time metrics, logging, and performance monitoring
- **Security Features**: Helmet, compression, rate limiting, and comprehensive validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL 13+
- Redis 6+ (optional, for caching)
- Solana CLI (for development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arcium-private-lending
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create PostgreSQL database
createdb arcium_lending

# Run migrations (if any)
npm run migration:run
```

5. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000` with documentation at `http://localhost:3000/api`.

## 📚 API Documentation

### Core Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Verify email address
- `POST /auth/request-password-reset` - Request password reset
- `GET /auth/profile` - Get user profile
- `POST /auth/profile` - Update user profile

#### Lending Operations
- `POST /lending/submit-application` - Submit a loan application
- `POST /lending/create-offer` - Create a loan offer
- `POST /lending/accept-offer` - Accept a loan offer
- `POST /lending/process-payment` - Process loan payments
- `GET /lending/statistics` - Get platform statistics

#### Encryption Services
- `POST /encryption/encrypt-lending-params` - Encrypt lending parameters
- `POST /encryption/risk-assessment` - Perform encrypted risk assessment
- `POST /encryption/encrypt-user-data` - Encrypt user financial data

#### Risk Assessment
- `POST /risk/assess` - Advanced risk assessment with ML
- `GET /risk/history` - Get risk assessment history
- `POST /risk/update-models` - Update risk models

#### Liquidation
- `GET /liquidation/status` - Get liquidation status
- `POST /liquidation/trigger/:loanId` - Trigger manual liquidation
- `GET /liquidation/history` - Get liquidation history

#### Governance
- `POST /governance/proposals` - Create governance proposal
- `POST /governance/proposals/:id/vote` - Vote on proposal
- `GET /governance/parameters` - Get protocol parameters
- `GET /governance/voting-power/:userId` - Get user voting power

#### Solana Integration
- `POST /solana/create-wallet` - Create a new Solana wallet
- `GET /solana/wallet/:publicKey` - Get wallet information
- `POST /solana/transfer-sol` - Transfer SOL between wallets
- `POST /solana/transfer-token` - Transfer SPL tokens

#### MagicBlock Real-time Operations
- `POST /magicblock/delegate-account` - Delegate account to Ephemeral Rollup
- `POST /magicblock/real-time-loan-approval` - Process real-time loan approval
- `POST /magicblock/real-time-payment` - Process real-time loan payment
- `POST /magicblock/real-time-loan-offer` - Create real-time loan offer
- `GET /magicblock/transactions` - Get all real-time transactions
- `GET /magicblock/stats` - Get Ephemeral Rollup statistics
- `POST /magicblock/router/route-transaction` - Route transaction intelligently
- `GET /magicblock/router/statistics` - Get routing statistics
- `GET /dashboard/real-time-metrics` - Live dashboard metrics

## 🔧 Architecture

### Modules

1. **DatabaseModule**: PostgreSQL database configuration and entities
2. **AuthModule**: User authentication and authorization
3. **LendingModule**: Core lending and borrowing logic
4. **EncryptionModule**: Arcium integration and encryption services
5. **SolanaModule**: Solana blockchain integration
6. **MagicBlockModule**: Real-time Ephemeral Rollups integration
7. **RiskModule**: Advanced risk assessment with ML models
8. **LiquidationModule**: Automated liquidation system
9. **GovernanceModule**: Protocol governance and voting
10. **MonitoringModule**: System monitoring and metrics
11. **AppModule**: Main application module

### Key Services

- **LendingService**: Manages loan applications, offers, and active loans
- **EncryptionService**: Handles encryption/decryption and risk assessment
- **SolanaService**: Manages Solana wallet operations and transactions
- **MagicBlockService**: Real-time Ephemeral Rollups integration and delegation
- **MagicRouterService**: Intelligent transaction routing between Solana and ERs
- **RealtimeDashboardService**: Live metrics and monitoring for real-time operations
- **AuthService**: User authentication, registration, and profile management
- **RiskAssessmentService**: Advanced ML-powered risk evaluation
- **LiquidationService**: Automated liquidation and risk management
- **GovernanceService**: Protocol governance and parameter management
- **MonitoringService**: System health, metrics, and performance monitoring

## 🔐 Security Features

### Encrypted Compute
- All sensitive lending parameters are encrypted using AES-256-GCM
- Risk assessment is performed on encrypted data
- User financial data is protected with strong encryption

### Privacy Protection
- Borrower and lender identities are protected
- Loan terms remain confidential until execution
- Transaction details are encrypted

### Solana Integration
- Secure wallet management
- Token transfers with proper validation
- Transaction history tracking

### MagicBlock Ephemeral Rollups
- Sub-10ms transaction finality for real-time operations
- Gasless transactions for enhanced user experience
- Intelligent routing between Solana mainnet and Ephemeral Rollups
- Real-time account delegation for optimal performance
- Live transaction monitoring and analytics

## 🎯 Use Cases

This protocol is perfect for:

1. **Private Lending**: Lend and borrow without exposing sensitive financial data
2. **Real-time Lending**: Sub-10ms loan approvals and payments using Ephemeral Rollups
3. **Institutional Trading**: Large institutions can trade without revealing positions
4. **DeFi Privacy**: Enhanced privacy for decentralized finance applications
5. **Cross-border Lending**: Secure international lending without data exposure
6. **High-frequency Operations**: Gasless transactions for frequent lending activities

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

## 🔮 Future Enhancements

- [x] Database persistence with PostgreSQL
- [x] User authentication with JWT
- [x] Advanced risk models with ML
- [x] Multi-token support
- [x] Liquidation mechanisms
- [x] Governance features
- [x] Comprehensive monitoring
- [x] Full Arcium SDK integration
- [x] MagicBlock Ephemeral Rollups integration
- [x] Real-time sub-10ms transaction processing
- [x] Gasless transactions
- [x] Intelligent transaction routing
- [ ] Zero-knowledge proofs
- [ ] Cross-chain integration
- [ ] Mobile app
- [ ] Advanced analytics dashboard
- [ ] Insurance integration
- [ ] DeFi yield farming

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For questions and support, please open an issue or contact the development team.

---

Built with ❤️ using NestJS, Solana, Arcium's encrypted compute technology, and MagicBlock Ephemeral Rollups.
