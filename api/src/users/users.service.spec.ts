import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.create({ email: 'test@test.com', username: 'test', password: 'password' })).rejects.toThrow(ConflictException);
    });

    it('should create a user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      
      const createdUser = { id: '1', email: 'test@test.com', username: 'test', baseCurrency: 'CZK' };
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.create({ email: 'test@test.com', username: 'test', password: 'password' });
      expect(result).toEqual({ id: '1', email: 'test@test.com', username: 'test', baseCurrency: 'CZK', createdAt: undefined, updatedAt: undefined });
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual({ id: '1', email: 'test@test.com' });
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      const result = await service.findOne('1');
      expect(result).toEqual({ id: '1', email: 'test@test.com' });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      mockPrismaService.user.update.mockResolvedValue({ id: '1', username: 'updated' });
      const result = await service.update('1', { username: 'updated' });
      expect(result).toEqual({ id: '1', username: 'updated' });
    });
  });

  describe('deleteAccount', () => {
    it('should delete user', async () => {
      mockPrismaService.user.delete.mockResolvedValue({ id: '1' });
      const result = await service.deleteAccount('1');
      expect(result).toEqual({ message: 'User account deleted successfully' });
    });
  });

  describe('changePassword', () => {
    it('should return nothing if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.changePassword('1', { oldPassword: 'old', newPassword: 'new' });
      expect(result).toBeUndefined();
    });

    it('should throw BadRequestException if old password incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      await expect(service.changePassword('1', { oldPassword: 'old', newPassword: 'new' })).rejects.toThrow(BadRequestException);
    });

    it('should update password if correct', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHash');

      mockPrismaService.user.update.mockResolvedValue({ id: '1' });

      const result = await service.changePassword('1', { oldPassword: 'old', newPassword: 'new' });
      expect(result).toEqual({ message: 'Password changed successfully' });
    });
  });
});
