import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MagicBlockService } from './magicblock.service';
import { MagicRouterService } from './magic-router.service';
import { RealtimeDashboardService } from './realtime-dashboard.service';
import { SolanaService } from '../solana/solana.service';
import { LendingService } from '../lending/lending.service';

describe('MagicBlock Integration', () => {
  let magicBlockService: MagicBlockService;
  let magicRouterService: MagicRouterService;
  let dashboardService: RealtimeDashboardService;
  let module: TestingModule;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          'MAGICBLOCK_RPC_URL': 'https://api.devnet.solana.com',
          'MAGICBLOCK_VALIDATOR_URL': 'https://validator.magicblock.gg',
          'MAGICBLOCK_PRIVATE_KEY': 'test-private-key',
          'MAGICBLOCK_PROGRAM_ID': '11111111111111111111111111111111',
          'SOLANA_PUBLIC_KEY': '11111111111111111111111111111111',
        };
        return config[key];
      }),
    };

    const mockSolanaService = {
      createKeypairFromSecret: jest.fn(),
    };

    const mockLendingService = {
      submitLoanApplication: jest.fn(),
      processLoanPayment: jest.fn(),
      createLoanOffer: jest.fn(),
      getLendingStatistics: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        MagicBlockService,
        MagicRouterService,
        RealtimeDashboardService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SolanaService,
          useValue: mockSolanaService,
        },
        {
          provide: LendingService,
          useValue: mockLendingService,
        },
      ],
    }).compile();

    magicBlockService = module.get<MagicBlockService>(MagicBlockService);
    magicRouterService = module.get<MagicRouterService>(MagicRouterService);
    dashboardService = module.get<RealtimeDashboardService>(RealtimeDashboardService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('MagicBlockService', () => {
    it('should be defined', () => {
      expect(magicBlockService).toBeDefined();
    });

    it('should delegate account to Ephemeral Rollup', async () => {
      const accountId = 'test-account-123';
      const accountType = 'loan_application';

      const result = await magicBlockService.delegateAccountToEphemeralRollup(accountId, accountType);

      expect(result).toBeDefined();
      expect(result.accountId).toBe(accountId);
      expect(result.isDelegated).toBe(true);
      expect(result.ephemeralRollupId).toBeDefined();
    });

    it('should process real-time loan approval', async () => {
      const loanApplicationId = 'loan-app-123';
      const borrowerId = 'borrower-123';
      const amount = 10000;
      const interestRate = 0.08;
      const duration = 365;
      const collateralRatio = 2.0;

      const result = await magicBlockService.processRealTimeLoanApproval(
        loanApplicationId,
        borrowerId,
        amount,
        interestRate,
        duration,
        collateralRatio
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('loan_approval');
      expect(result.status).toBe('completed');
      expect(result.data.loanApplicationId).toBe(loanApplicationId);
    });

    it('should process real-time payment', async () => {
      const loanId = 'loan-123';
      const paymentAmount = 1000;
      const borrowerSecretKey = 'test-secret-key';

      const result = await magicBlockService.processRealTimePayment(
        loanId,
        paymentAmount,
        borrowerSecretKey
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('payment');
      expect(result.status).toBe('completed');
      expect(result.data.loanId).toBe(loanId);
    });

    it('should create real-time loan offer', async () => {
      const lenderId = 'lender-123';
      const loanApplicationId = 'loan-app-123';
      const offeredAmount = 10000;
      const offeredInterestRate = 0.08;
      const terms = 'Standard terms';

      const result = await magicBlockService.createRealTimeLoanOffer(
        lenderId,
        loanApplicationId,
        offeredAmount,
        offeredInterestRate,
        terms
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('offer_creation');
      expect(result.status).toBe('completed');
      expect(result.data.lenderId).toBe(lenderId);
    });

    it('should get network status', async () => {
      const status = await magicBlockService.getNetworkStatus();

      expect(status).toBeDefined();
      expect(status.connected).toBe(true);
      expect(status.ephemeralRollupsAvailable).toBeGreaterThan(0);
      expect(status.version).toBeDefined();
    });
  });

  describe('MagicRouterService', () => {
    it('should be defined', () => {
      expect(magicRouterService).toBeDefined();
    });

    it('should get routing statistics', async () => {
      const stats = await magicRouterService.getRoutingStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalTransactions).toBeGreaterThanOrEqual(0);
      expect(stats.ephemeralRollupTransactions).toBeGreaterThanOrEqual(0);
      expect(stats.solanaTransactions).toBeGreaterThanOrEqual(0);
      expect(stats.averageLatency).toBeGreaterThanOrEqual(0);
      expect(stats.averageCost).toBeGreaterThanOrEqual(0);
      expect(stats.routingAccuracy).toBeGreaterThanOrEqual(0);
    });

    it('should get available Ephemeral Rollups', async () => {
      const ers = await magicRouterService.getAvailableEphemeralRollups();

      expect(ers).toBeDefined();
      expect(Array.isArray(ers)).toBe(true);
      expect(ers.length).toBeGreaterThan(0);
      expect(ers[0]).toHaveProperty('id');
      expect(ers[0]).toHaveProperty('status');
      expect(ers[0]).toHaveProperty('latency');
      expect(ers[0]).toHaveProperty('capacity');
      expect(ers[0]).toHaveProperty('region');
    });

    it('should optimize routing rules', async () => {
      const result = await magicRouterService.optimizeRoutingRules();

      expect(result).toBeDefined();
      expect(result.updated).toBe(true);
      expect(Array.isArray(result.newRules)).toBe(true);
      expect(result.performanceImprovement).toBeGreaterThanOrEqual(0);
    });
  });

  describe('RealtimeDashboardService', () => {
    it('should be defined', () => {
      expect(dashboardService).toBeDefined();
    });

    it('should get dashboard metrics', async () => {
      const metrics = await dashboardService.getDashboardMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.realTimeTransactions).toBeDefined();
      expect(metrics.lendingActivity).toBeDefined();
      expect(metrics.networkPerformance).toBeDefined();
      expect(metrics.ephemeralRollups).toBeDefined();
    });

    it('should get live transactions', async () => {
      const transactions = await dashboardService.getLiveTransactions(10);

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should get system health', async () => {
      const health = await dashboardService.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.overall).toMatch(/healthy|degraded|critical/);
      expect(health.components).toBeDefined();
      expect(health.alerts).toBeDefined();
      expect(health.lastUpdated).toBeDefined();
    });

    it('should get performance trends', () => {
      const trends = dashboardService.getPerformanceTrends();

      expect(trends).toBeDefined();
      expect(trends.latency).toBeDefined();
      expect(trends.throughput).toBeDefined();
      expect(trends.successRate).toBeDefined();
      expect(Array.isArray(trends.latency)).toBe(true);
      expect(Array.isArray(trends.throughput)).toBe(true);
      expect(Array.isArray(trends.successRate)).toBe(true);
    });

    it('should get real-time alerts', () => {
      const alerts = dashboardService.getRealTimeAlerts();

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle end-to-end real-time loan flow', async () => {
      // 1. Submit real-time loan application
      const loanApplication = await magicBlockService.processRealTimeLoanApproval(
        'loan-app-123',
        'borrower-123',
        10000,
        0.08,
        365,
        2.0
      );

      expect(loanApplication.status).toBe('completed');

      // 2. Create real-time loan offer
      const loanOffer = await magicBlockService.createRealTimeLoanOffer(
        'lender-123',
        'loan-app-123',
        10000,
        0.08,
        'Standard terms'
      );

      expect(loanOffer.status).toBe('completed');

      // 3. Process real-time payment
      const payment = await magicBlockService.processRealTimePayment(
        'loan-123',
        1000,
        'test-secret-key'
      );

      expect(payment.status).toBe('completed');

      // 4. Check dashboard metrics
      const metrics = await dashboardService.getDashboardMetrics();
      expect(metrics.realTimeTransactions.total).toBeGreaterThan(0);
    });

    it('should handle system health monitoring', async () => {
      const health = await dashboardService.getSystemHealth();
      
      expect(health.overall).toMatch(/healthy|degraded|critical/);
      expect(health.components.magicBlock).toMatch(/healthy|degraded|critical/);
      expect(health.components.lending).toMatch(/healthy|degraded|critical/);
      expect(health.components.solana).toMatch(/healthy|degraded|critical/);
      expect(health.components.ephemeralRollups).toMatch(/healthy|degraded|critical/);
    });
  });
});
