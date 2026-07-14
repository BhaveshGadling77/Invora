import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { config } from '../config/config';
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler';
import { sendEmail, emailVerificationTemplate, passwordResetTemplate } from '../utils/email';
import { generateSecureToken, hashToken, getExpiryDate } from '../utils/helpers';
import { JwtPayload } from '../types';
import { Role } from '@prisma/client';

interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

interface LoginDto {
  email: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // ─── Token Generators ────────────────────────────────────────────────────

  private generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
    } as jwt.SignOptions);
  }

  private generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry,
    } as jwt.SignOptions);
  }

  private async createTokenPair(user: {
    id: string;
    email: string;
    role: Role;
    name: string;
  }): Promise<TokenPair> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store hashed refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: hashToken(refreshToken),
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictError('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, config.bcrypt.rounds);
    const verificationToken = generateSecureToken();
    const hashedToken = hashToken(verificationToken);

    const user = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role || 'STAFF',
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: getExpiryDate(24 * 60), // 24 hours
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // Send verification email (non-blocking)
    sendEmail({
      to: user.email,
      subject: 'Verify your Inventra account',
      html: emailVerificationTemplate(user.name, verificationToken),
    }).catch(() => {}); // fire-and-forget

    return user;
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<TokenPair & { user: object }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true, name: true, email: true, role: true,
        password: true, status: true, isEmailVerified: true,
      },
    });

    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (user.status === 'SUSPENDED') throw new UnauthorizedError('Account suspended');
    if (user.status === 'INACTIVE') throw new UnauthorizedError('Account inactive');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.createTokenPair(user);

    const { password: _p, ...safeUser } = user;

    return { ...tokens, user: safeUser };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const hashedToken = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: { select: { id: true, email: true, role: true, name: true, status: true } } },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired or revoked');
    }

    if (storedToken.user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account inactive');
    }

    // Rotate refresh token (revoke old, issue new)
    await prisma.refreshToken.delete({ where: { token: hashedToken } });

    return this.createTokenPair(storedToken.user);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(refreshToken: string): Promise<void> {
    const hashedToken = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { token: hashedToken } });
  }

  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new AppError('Invalid or expired verification token', 400);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    // Don't reveal whether email exists
    if (!user) return;

    const resetToken = generateSecureToken();
    const hashedToken = hashToken(resetToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: getExpiryDate(60), // 1 hour
      },
    });

    await sendEmail({
      to: user.email,
      subject: 'Reset your Inventra password',
      html: passwordResetTemplate(user.name, resetToken),
    });
  }

  // ─── Reset Password ───────────────────────────────────────────────────────

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.rounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    // Invalidate all existing sessions after password reset
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  }
}

export const authService = new AuthService();
