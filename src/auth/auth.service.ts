import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { DatabaseModule } from '../database/database.module';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    walletAddress: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return user;
    }
    
    return null;
  }

  async login(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        walletAddress: user.walletAddress,
      },
    };
  }

  async register(registerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerData.password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email: registerData.email,
      passwordHash,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      role: registerData.role || UserRole.BORROWER,
      status: UserStatus.PENDING_VERIFICATION,
      emailVerificationToken: uuidv4(),
    });

    const savedUser = await this.userRepository.save(user);

    return this.login(savedUser);
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return false;
    }

    await this.userRepository.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      status: UserStatus.ACTIVE,
    });

    return true;
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if user exists
      return true;
    }

    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // In production, send email with reset token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return false;
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return true;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateUserProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      preferences?: any;
    },
  ): Promise<User> {
    await this.userRepository.update(userId, updateData);
    return this.getUserById(userId);
  }

  async updateWalletAddress(userId: string, walletAddress: string): Promise<User> {
    // Check if wallet is already in use
    const existingUser = await this.userRepository.findOne({
      where: { walletAddress },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Wallet address is already in use');
    }

    await this.userRepository.update(userId, { walletAddress });
    return this.getUserById(userId);
  }

  async updateCreditScore(userId: string, creditScore: number): Promise<User> {
    await this.userRepository.update(userId, { creditScore });
    return this.getUserById(userId);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async suspendUser(userId: string, reason?: string): Promise<User> {
    await this.userRepository.update(userId, {
      status: UserStatus.SUSPENDED,
    });
    return this.getUserById(userId);
  }

  async activateUser(userId: string): Promise<User> {
    await this.userRepository.update(userId, {
      status: UserStatus.ACTIVE,
    });
    return this.getUserById(userId);
  }
}
