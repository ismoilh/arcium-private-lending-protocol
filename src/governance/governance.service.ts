import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  proposalType: 'PARAMETER_CHANGE' | 'PROTOCOL_UPGRADE' | 'EMERGENCY_PAUSE' | 'TREASURY_ALLOCATION';
  parameters: Record<string, any>;
  status: 'DRAFT' | 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED';
  startTime: Date;
  endTime: Date;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  proposalId: string;
  voterId: string;
  voteType: 'FOR' | 'AGAINST' | 'ABSTAIN';
  votingPower: number;
  reason?: string;
  createdAt: Date;
}

export interface ProtocolParameters {
  // Lending parameters
  maxLoanAmount: number;
  minCollateralRatio: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  
  // Interest rate parameters
  baseInterestRate: number;
  maxInterestRate: number;
  interestRateStep: number;
  
  // Risk parameters
  maxRiskScore: number;
  creditScoreWeight: number;
  marketVolatilityWeight: number;
  
  // Protocol parameters
  protocolFee: number;
  treasuryFee: number;
  emergencyPause: boolean;
  
  // Governance parameters
  proposalThreshold: number;
  votingPeriod: number;
  quorumThreshold: number;
  executionDelay: number;
}

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);
  private currentParameters: ProtocolParameters;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // Initialize with default parameters
    this.currentParameters = this.getDefaultParameters();
  }

  /**
   * Create a new governance proposal
   */
  async createProposal(
    proposerId: string,
    proposalData: {
      title: string;
      description: string;
      proposalType: GovernanceProposal['proposalType'];
      parameters: Record<string, any>;
    },
  ): Promise<GovernanceProposal> {
    // Check if user has sufficient voting power
    const proposer = await this.userRepository.findOne({
      where: { id: proposerId },
    });

    if (!proposer) {
      throw new Error('Proposer not found');
    }

    const votingPower = await this.getVotingPower(proposerId);
    if (votingPower < this.currentParameters.proposalThreshold) {
      throw new Error('Insufficient voting power to create proposal');
    }

    const proposal: GovernanceProposal = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: proposalData.title,
      description: proposalData.description,
      proposerId,
      proposalType: proposalData.proposalType,
      parameters: proposalData.parameters,
      status: 'DRAFT',
      startTime: new Date(),
      endTime: new Date(Date.now() + this.currentParameters.votingPeriod * 24 * 60 * 60 * 1000),
      votesFor: 0,
      votesAgainst: 0,
      totalVotes: 0,
      quorum: this.currentParameters.quorumThreshold,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In production, save to database
    this.logger.log(`Proposal created: ${proposal.id} by ${proposerId}`);
    
    return proposal;
  }

  /**
   * Vote on a proposal
   */
  async voteOnProposal(
    proposalId: string,
    voterId: string,
    voteType: Vote['voteType'],
    reason?: string,
  ): Promise<Vote> {
    // Check if user can vote
    const voter = await this.userRepository.findOne({
      where: { id: voterId },
    });

    if (!voter) {
      throw new Error('Voter not found');
    }

    const votingPower = await this.getVotingPower(voterId);
    if (votingPower <= 0) {
      throw new Error('No voting power');
    }

    // Check if proposal is active
    const proposal = await this.getProposal(proposalId);
    if (!proposal || proposal.status !== 'ACTIVE') {
      throw new Error('Proposal not active');
    }

    if (new Date() > proposal.endTime) {
      throw new Error('Voting period has ended');
    }

    const vote: Vote = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      proposalId,
      voterId,
      voteType,
      votingPower,
      reason,
      createdAt: new Date(),
    };

    // Update proposal votes
    await this.updateProposalVotes(proposalId, voteType, votingPower);

    this.logger.log(`Vote cast: ${voteType} on ${proposalId} by ${voterId}`);
    
    return vote;
  }

  /**
   * Execute a passed proposal
   */
  async executeProposal(proposalId: string, executorId: string): Promise<boolean> {
    const proposal = await this.getProposal(proposalId);
    
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'PASSED') {
      throw new Error('Proposal has not passed');
    }

    // Check execution delay
    const executionTime = new Date(proposal.endTime.getTime() + this.currentParameters.executionDelay * 60 * 60 * 1000);
    if (new Date() < executionTime) {
      throw new Error('Execution delay not yet passed');
    }

    // Execute the proposal
    await this.executeProposalChanges(proposal);

    // Update proposal status
    proposal.status = 'EXECUTED';
    proposal.updatedAt = new Date();

    this.logger.log(`Proposal executed: ${proposalId} by ${executorId}`);
    
    return true;
  }

  /**
   * Get current protocol parameters
   */
  getCurrentParameters(): ProtocolParameters {
    return { ...this.currentParameters };
  }

  /**
   * Update protocol parameters
   */
  async updateParameters(updates: Partial<ProtocolParameters>): Promise<void> {
    this.currentParameters = { ...this.currentParameters, ...updates };
    this.logger.log('Protocol parameters updated', updates);
  }

  /**
   * Get user's voting power
   */
  async getVotingPower(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) return 0;

    // Calculate voting power based on user's stake in the protocol
    // This could be based on:
    // - Amount lent/borrowed
    // - Token holdings
    // - Reputation score
    // - Time in protocol
    
    let votingPower = 0;
    
    // Base voting power
    votingPower += 1;
    
    // Based on total activity
    votingPower += Math.log10(user.totalBorrowed + user.totalLent + 1) * 2;
    
    // Based on credit score
    votingPower += user.creditScore / 1000;
    
    // Based on role
    if (user.role === UserRole.ADMIN) {
      votingPower += 100;
    } else if (user.role === UserRole.LENDER) {
      votingPower += 5;
    }

    return Math.floor(votingPower);
  }

  /**
   * Get all proposals
   */
  async getProposals(status?: GovernanceProposal['status']): Promise<GovernanceProposal[]> {
    // In production, this would query the database
    return [];
  }

  /**
   * Get proposal by ID
   */
  async getProposal(proposalId: string): Promise<GovernanceProposal | null> {
    // In production, this would query the database
    return null;
  }

  /**
   * Get votes for a proposal
   */
  async getProposalVotes(proposalId: string): Promise<Vote[]> {
    // In production, this would query the database
    return [];
  }

  /**
   * Check if proposal has passed
   */
  async checkProposalStatus(proposalId: string): Promise<GovernanceProposal['status']> {
    const proposal = await this.getProposal(proposalId);
    
    if (!proposal) return 'REJECTED';

    if (proposal.status !== 'ACTIVE') {
      return proposal.status;
    }

    // Check if voting period has ended
    if (new Date() > proposal.endTime) {
      // Check if proposal passed
      const totalVotingPower = proposal.votesFor + proposal.votesAgainst;
      const quorumMet = totalVotingPower >= proposal.quorum;
      const majorityFor = proposal.votesFor > proposal.votesAgainst;

      if (quorumMet && majorityFor) {
        proposal.status = 'PASSED';
      } else {
        proposal.status = 'REJECTED';
      }

      proposal.updatedAt = new Date();
    }

    return proposal.status;
  }

  /**
   * Get default protocol parameters
   */
  private getDefaultParameters(): ProtocolParameters {
    return {
      // Lending parameters
      maxLoanAmount: 2000000, // $2M
      minCollateralRatio: 1.5,
      liquidationThreshold: 1.2,
      liquidationPenalty: 0.05, // 5%
      
      // Interest rate parameters
      baseInterestRate: 0.08, // 8%
      maxInterestRate: 0.25, // 25%
      interestRateStep: 0.01, // 1%
      
      // Risk parameters
      maxRiskScore: 70,
      creditScoreWeight: 0.35,
      marketVolatilityWeight: 0.25,
      
      // Protocol parameters
      protocolFee: 0.01, // 1%
      treasuryFee: 0.005, // 0.5%
      emergencyPause: false,
      
      // Governance parameters
      proposalThreshold: 1000, // voting power
      votingPeriod: 7, // days
      quorumThreshold: 10000, // voting power
      executionDelay: 24, // hours
    };
  }

  /**
   * Update proposal votes
   */
  private async updateProposalVotes(
    proposalId: string,
    voteType: Vote['voteType'],
    votingPower: number,
  ): Promise<void> {
    // In production, this would update the database
    this.logger.log(`Updating votes for proposal ${proposalId}: ${voteType} (+${votingPower})`);
  }

  /**
   * Execute proposal changes
   */
  private async executeProposalChanges(proposal: GovernanceProposal): Promise<void> {
    switch (proposal.proposalType) {
      case 'PARAMETER_CHANGE':
        await this.updateParameters(proposal.parameters);
        break;
      case 'PROTOCOL_UPGRADE':
        // Handle protocol upgrade
        this.logger.log('Protocol upgrade executed', proposal.parameters);
        break;
      case 'EMERGENCY_PAUSE':
        this.currentParameters.emergencyPause = true;
        this.logger.warn('Protocol paused due to emergency proposal');
        break;
      case 'TREASURY_ALLOCATION':
        // Handle treasury allocation
        this.logger.log('Treasury allocation executed', proposal.parameters);
        break;
    }
  }
}
