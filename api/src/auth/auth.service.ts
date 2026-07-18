import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';

export type ValidatedUser = {
  id: string;
  email: string;
  username: string;
  baseCurrency: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // overit email a heslo
  async validateUser(
    email: string,
    pass: string,
  ): Promise<ValidatedUser | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        baseCurrency: user.baseCurrency,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }
    return null;
  }

  // vygenerovat tokeny a ulozit refresh token do DB
  async login(user: ValidatedUser) {
    const payload = { email: user.email, sub: user.id };

    // vygenerujeme oba tokeny
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // hashneme refresh token
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // overime podpis tokenu, zjistime, zda nevyprselo 7 dni
      const payload = await this.jwtService.verifyAsync<{
        email: string;
        sub: string;
      }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // najdeme usera v DB podle id z tokenu
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      // pokud uzivatel neexistuje, nebo se mezitim odhlasil
      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException(
          'Unauthorized: User not found or logged out',
        );
      }

      // porovname hashnuty refresh token z DB s tokenem z requestu
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Unauthorized: Invalid refresh token');
      }

      // vse ok!
      const validatedUser: ValidatedUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        baseCurrency: user.baseCurrency,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return this.login(validatedUser);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token ', { cause: e });
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { message: 'If the email exists, a reset link will be sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1h

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpiry: resetExpires,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);

    return { message: 'If the email exists, a reset link will be sent.' };
  }

  async resetPassword(token: string, dto: ResetPasswordDto) {
    console.log('Reset Password called with token:', token);
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { gte: new Date() },
      },
    });
    console.log('User found:', user);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    if (dto.newPassword !== dto.confirmPassword) {
      throw new UnauthorizedException('Passwords do not match');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
        hashedRefreshToken: null, // log out user from all devices
      },
    });

    return { message: 'Password has been reset successfully' };
  }
}
