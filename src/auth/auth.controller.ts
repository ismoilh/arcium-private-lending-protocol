import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserRole } from '../entities/user.entity';

export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export class VerifyEmailDto {
  token: string;
}

export class RequestPasswordResetDto {
  email: string;
}

export class ResetPasswordDto {
  token: string;
  newPassword: string;
}

export class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  preferences?: any;
}

export class UpdateWalletDto {
  walletAddress: string;
}

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: Object })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginData: LoginDto): Promise<AuthResponse> {
    const user = await this.authService.validateUser(loginData.email, loginData.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerData: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerData);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async verifyEmail(@Body() verifyData: VerifyEmailDto): Promise<{ success: boolean }> {
    const success = await this.authService.verifyEmail(verifyData.token);
    return { success };
  }

  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async requestPasswordReset(@Body() resetData: RequestPasswordResetDto): Promise<{ success: boolean }> {
    const success = await this.authService.requestPasswordReset(resetData.email);
    return { success };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetData: ResetPasswordDto): Promise<{ success: boolean }> {
    const success = await this.authService.resetPassword(resetData.token, resetData.newPassword);
    return { success };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@Request() req): Promise<any> {
    return req.user;
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Request() req,
    @Body() updateData: UpdateProfileDto,
  ): Promise<any> {
    return this.authService.updateUserProfile(req.user.id, updateData);
  }

  @Post('wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update wallet address' })
  @ApiBody({ type: UpdateWalletDto })
  @ApiResponse({ status: 200, description: 'Wallet address updated successfully' })
  @ApiResponse({ status: 409, description: 'Wallet address already in use' })
  async updateWallet(
    @Request() req,
    @Body() walletData: UpdateWalletDto,
  ): Promise<any> {
    return this.authService.updateWalletAddress(req.user.id, walletData.walletAddress);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Request() req): Promise<any[]> {
    // In production, add admin role check
    return this.authService.getUsersByRole('borrower' as any);
  }
}
