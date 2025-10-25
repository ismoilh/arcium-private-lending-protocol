# Arcium Private Lending Protocol

A private lending and borrowing protocol built with NestJS that integrates Arcium's encrypted compute capabilities for secure financial transactions on Solana.

## 🔐 Features

- **Encrypted Compute Integration**: Leverages Arcium's MPC network for secure parameter processing
- **Private Lending**: Borrow and lend with encrypted sensitive data
- **Solana Integration**: Built on Solana blockchain for fast, low-cost transactions
- **Risk Assessment**: Encrypted risk evaluation using Arcium's compute capabilities
- **Secure Transactions**: All sensitive data is encrypted using AES-256-GCM
- **RESTful API**: Complete API documentation with Swagger
- **TypeScript**: Fully typed codebase for better development experience

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
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

4. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000` with documentation at `http://localhost:3000/api`.

## 📚 API Documentation

### Core Endpoints

#### Lending Operations
- `POST /lending/submit-application` - Submit a loan application
- `POST /lending/create-offer` - Create a loan offer
- `POST /lending/accept-offer` - Accept a loan offer
- `POST /lending/process-payment` - Process loan payments

#### Encryption Services
- `POST /encryption/encrypt-lending-params` - Encrypt lending parameters
- `POST /encryption/risk-assessment` - Perform encrypted risk assessment
- `POST /encryption/encrypt-user-data` - Encrypt user financial data

#### Solana Integration
- `POST /solana/create-wallet` - Create a new Solana wallet
- `GET /solana/wallet/:publicKey` - Get wallet information
- `POST /solana/transfer-sol` - Transfer SOL between wallets
- `POST /solana/transfer-token` - Transfer SPL tokens

## 🔧 Architecture

### Modules

1. **LendingModule**: Core lending and borrowing logic
2. **EncryptionModule**: Arcium integration and encryption services
3. **SolanaModule**: Solana blockchain integration
4. **AppModule**: Main application module

### Key Services

- **LendingService**: Manages loan applications, offers, and active loans
- **EncryptionService**: Handles encryption/decryption and risk assessment
- **SolanaService**: Manages Solana wallet operations and transactions

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

## 🎯 Use Cases

This protocol is perfect for:

1. **Private Lending**: Lend and borrow without exposing sensitive financial data
2. **Institutional Trading**: Large institutions can trade without revealing positions
3. **DeFi Privacy**: Enhanced privacy for decentralized finance applications
4. **Cross-border Lending**: Secure international lending without data exposure

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

- [ ] Full Arcium SDK integration
- [ ] Database persistence
- [ ] User authentication
- [ ] Advanced risk models
- [ ] Multi-token support
- [ ] Liquidation mechanisms
- [ ] Governance features

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

Built with ❤️ using NestJS, Solana, and Arcium's encrypted compute technology.
