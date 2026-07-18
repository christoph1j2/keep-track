import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

jest.mock('bcrypt');
jest.mock('crypto');

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if validation successful', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@test.com', passwordHash: 'hash', username: 'test', baseCurrency: 'CZK', createdAt: new Date(), updatedAt: new Date() });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@test.com');
    });

    it('should return null if validation fails', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@test.com', passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens and user', async () => {
      const user = { id: '1', email: 'test@test.com', username: 'test', baseCurrency: 'CZK', createdAt: new Date(), updatedAt: new Date() };
      mockJwtService.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');

      const result = await service.login(user);
      expect(result.access_token).toBe('access_token');
      expect(result.refresh_token).toBe('refresh_token');
      expect(result.user).toEqual(user);
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if token invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      await expect(service.refreshTokens('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens if successful', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: '1', email: 'test@test.com' });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', hashedRefreshToken: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');

      const result = await service.refreshTokens('token');
      expect(result.access_token).toBe('access_token');
    });
    
    it('should throw UnauthorizedException if compare returns false', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: '1', email: 'test@test.com' });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', hashedRefreshToken: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should nullify refresh token', async () => {
      await service.logout('1');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { hashedRefreshToken: null },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send email if user exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@test.com' });
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'token' });
      
      const result = await service.forgotPassword('test@test.com');
      expect(result.message).toBeDefined();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should do nothing but return message if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await service.forgotPassword('test@test.com');
      expect(result.message).toBeDefined();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw if user not found or token expired', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword('token', { newPassword: 'pass', confirmPassword: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if passwords do not match', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: '1' });
      await expect(service.resetPassword('token', { newPassword: 'pass', confirmPassword: 'diff' })).rejects.toThrow(UnauthorizedException);
    });

    it('should reset password', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: '1' });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');

      const result = await service.resetPassword('token', { newPassword: 'pass', confirmPassword: 'pass' });
      expect(result.message).toBeDefined();
    });
  });
});
