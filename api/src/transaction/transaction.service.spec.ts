import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction with category', async () => {
      const dto = { amount: 100, name: 'Test', date: new Date(), type: 'EXPENSE' as const, categoryId: '12345678-1234-1234-1234-123456789012' };
      mockPrismaService.category.findFirst.mockResolvedValue({ id: dto.categoryId });
      mockPrismaService.transaction.create.mockResolvedValue({ id: '1', ...dto, userId: 'user-1' });

      const result = await service.create('user-1', dto);
      expect(result.id).toBe('1');
    });

    it('should create a transaction without category', async () => {
      const dto = { amount: 100, name: 'Test', date: new Date(), type: 'EXPENSE' as const };
      mockPrismaService.transaction.create.mockResolvedValue({ id: '1', ...dto, userId: 'user-1' });

      const result = await service.create('user-1', dto);
      expect(result.id).toBe('1');
    });

    it('should throw BadRequestException if categoryId is invalid format', async () => {
      const dto = { amount: 100, name: 'Test', date: new Date(), type: 'EXPENSE' as const, categoryId: 'invalid' };
      await expect(service.create('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if category not found', async () => {
      const dto = { amount: 100, name: 'Test', date: new Date(), type: 'EXPENSE' as const, categoryId: '12345678-1234-1234-1234-123456789012' };
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      await expect(service.create('user-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all transactions for user', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAll('user-1');
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('findOne', () => {
    it('should return a transaction', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue({ id: '1' });
      const result = await service.findOne('user-1', '1');
      expect(result).toEqual({ id: '1' });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.transaction.findFirst.mockResolvedValue(null);
      await expect(service.findOne('user-1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBatch', () => {
    it('should create multiple transactions', async () => {
      const dtos = [
        { amount: 100, name: 'Test 1', date: new Date(), type: 'EXPENSE' as const },
        { amount: 200, name: 'Test 2', date: new Date(), type: 'EXPENSE' as const, categoryId: '12345678-1234-1234-1234-123456789012' }
      ];
      mockPrismaService.category.findMany.mockResolvedValue([{ id: '12345678-1234-1234-1234-123456789012' }]);
      mockPrismaService.transaction.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createBatch('user-1', dtos);
      expect(result.count).toBe(2);
    });

    it('should throw BadRequestException for invalid category format in batch', async () => {
      const dtos = [{ amount: 100, name: 'Test', date: new Date(), type: 'EXPENSE' as const, categoryId: 'invalid' }];
      await expect(service.createBatch('user-1', dtos)).rejects.toThrow(BadRequestException);
    });
    
    it('should throw BadRequestException if category missing in batch', async () => {
      const dtos = [{ amount: 100, name: 'Test', date: new Date(), type: 'EXPENSE' as const, categoryId: '12345678-1234-1234-1234-123456789012' }];
      mockPrismaService.category.findMany.mockResolvedValue([]);
      await expect(service.createBatch('user-1', dtos)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      mockPrismaService.transaction.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.transaction.findUnique.mockResolvedValue({ id: '1', amount: 200 });

      const result = await service.update('user-1', '1', { amount: 200 });
      expect(result.amount).toBe(200);
    });

    it('should throw NotFoundException if no records updated', async () => {
      mockPrismaService.transaction.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.update('user-1', '1', { amount: 200 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a transaction', async () => {
      mockPrismaService.transaction.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.remove('user-1', '1');
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if no records deleted', async () => {
      mockPrismaService.transaction.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.remove('user-1', '1')).rejects.toThrow(NotFoundException);
    });
  });
});
