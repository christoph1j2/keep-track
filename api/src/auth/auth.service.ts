import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

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
}
