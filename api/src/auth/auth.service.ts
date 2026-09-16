import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
import { Role } from '@prisma/client';

/**
 * Represents a user that has been validated through the authentication process.
 * This type is used to ensure that only authenticated users can access certain
 * parts of the application, and it contains essential user information.
 */
export type ValidatedUser = {
  id: string;
  email: string;
  username: string;
  baseCurrency: string;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Validates a user's email and password.
   * 
   * @param email - The email of the user to validate.
   * @param pass - The password of the user to validate.
   * @returns - A ValidatedUser object if the credentials are valid, or null if they are not.
   */
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
        role: user.role,
      };
    }
    return null;
  }

  /**
   * Generates JWT access and refresh tokens for a validated user and stores 
   * the hashed refresh token in the database.
   * 
   * @param user - The validated user for whom to generate tokens. 
   * @returns - An object containing the access token, refresh token, and user information.
   */
  async login(user: ValidatedUser) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    // Generate access and refresh tokens with different expiration times
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // Hash the refresh token before storing it in the database for security
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

  /**
   * Refreshes the access token using the refresh token.
   * 
   * @param refreshToken - The refresh token provided by the client. 
   * @returns - An object containing a new access token and refresh token 
   * if the refresh token is valid (not expired or tampered with).
   */
  async refreshTokens(refreshToken: string) {
    try {
      // Verify the refresh token (validate its signature and expiration) and extract the payload
      const payload = await this.jwtService.verifyAsync<{
        email: string;
        sub: string;
      }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Find the user in the database by ID from the payload
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      // If the user is not found or logged out, throw error
      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException(
          'Unauthorized: User not found or logged out',
        );
      }

      // Compare refresh token with the hashed version stored in the database
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Unauthorized: Invalid refresh token');
      }

      // Everything ok! Generate new tokens and return them
      const validatedUser: ValidatedUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        baseCurrency: user.baseCurrency,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
      };

      return this.login(validatedUser);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token ', { cause: e });
    }
  }

  /**
   * Logs out the user by clearing the hashed refresh token in the database, effectively 
   * invalidating any existing refresh tokens.
   * 
   * @param userId - The ID of the user to log out. 
   */
  async logout(userId: string) {
    // Clear the hashed refresh token in the database to log out the user
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }

  /**
   * Initiates the forgot password process by generating a reset token, storing it in the database,
   * 
   * @param email - The email of the user who requested a password reset.
   * @returns - A message indicating that a reset link will be sent if the email exists.
   */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { message: 'If the email exists, a reset link will be sent.' };
    }

    // Generate a secure random token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set the token expiry time to 1 hour from now
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1h

    // Store the reset token and its expiry in the database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpiry: resetExpires,
      },
    });

    // Send the reset password email with the reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);

    return { message: 'If the email exists, a reset link will be sent.' };
  }

  /**
   * Resets the user's password using the provided reset token and new password.
   * 
   * @param token - The reset token sent to the user's email for password reset.
   * @param dto - An object containing the new password and its confirmation.
   * @returns - A message indicating that the password has been reset successfully.
   */
  async resetPassword(token: string, dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    if (dto.newPassword !== dto.confirmPassword) {
      throw new UnauthorizedException('Passwords do not match');
    }

    // Hash the new password before storing it in the database
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
