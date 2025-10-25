import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { GovernanceService, GovernanceProposal, Vote, ProtocolParameters } from './governance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class CreateProposalDto {
  title: string;
  description: string;
  proposalType: 'PARAMETER_CHANGE' | 'PROTOCOL_UPGRADE' | 'EMERGENCY_PAUSE' | 'TREASURY_ALLOCATION';
  parameters: Record<string, any>;
}

export class VoteDto {
  voteType: 'FOR' | 'AGAINST' | 'ABSTAIN';
  reason?: string;
}

@ApiTags('governance')
@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post('proposals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new governance proposal' })
  @ApiBody({ type: CreateProposalDto })
  @ApiResponse({ status: 201, description: 'Proposal created successfully' })
  async createProposal(
    @Body() proposalData: CreateProposalDto,
    @Param('userId') userId: string,
  ): Promise<GovernanceProposal> {
    return this.governanceService.createProposal(userId, proposalData);
  }

  @Post('proposals/:proposalId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a proposal' })
  @ApiBody({ type: VoteDto })
  @ApiResponse({ status: 200, description: 'Vote cast successfully' })
  async voteOnProposal(
    @Param('proposalId') proposalId: string,
    @Body() voteData: VoteDto,
    @Param('userId') userId: string,
  ): Promise<Vote> {
    return this.governanceService.voteOnProposal(proposalId, userId, voteData.voteType, voteData.reason);
  }

  @Post('proposals/:proposalId/execute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute a passed proposal' })
  @ApiResponse({ status: 200, description: 'Proposal executed successfully' })
  async executeProposal(
    @Param('proposalId') proposalId: string,
    @Param('executorId') executorId: string,
  ): Promise<{ success: boolean }> {
    const success = await this.governanceService.executeProposal(proposalId, executorId);
    return { success };
  }

  @Get('proposals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all proposals' })
  @ApiResponse({ status: 200, description: 'Proposals retrieved successfully' })
  async getProposals(@Param('status') status?: string): Promise<GovernanceProposal[]> {
    return this.governanceService.getProposals(status as any);
  }

  @Get('proposals/:proposalId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get proposal by ID' })
  @ApiResponse({ status: 200, description: 'Proposal retrieved successfully' })
  async getProposal(@Param('proposalId') proposalId: string): Promise<GovernanceProposal | null> {
    return this.governanceService.getProposal(proposalId);
  }

  @Get('proposals/:proposalId/votes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get votes for a proposal' })
  @ApiResponse({ status: 200, description: 'Votes retrieved successfully' })
  async getProposalVotes(@Param('proposalId') proposalId: string): Promise<Vote[]> {
    return this.governanceService.getProposalVotes(proposalId);
  }

  @Get('parameters')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current protocol parameters' })
  @ApiResponse({ status: 200, description: 'Parameters retrieved successfully' })
  async getParameters(): Promise<ProtocolParameters> {
    return this.governanceService.getCurrentParameters();
  }

  @Get('voting-power/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user voting power' })
  @ApiResponse({ status: 200, description: 'Voting power retrieved successfully' })
  async getVotingPower(@Param('userId') userId: string): Promise<{ votingPower: number }> {
    const votingPower = await this.governanceService.getVotingPower(userId);
    return { votingPower };
  }
}
