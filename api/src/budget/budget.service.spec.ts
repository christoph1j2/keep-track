import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BudgetService', () => {
  let service: BudgetService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    budget: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if category not found', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      await expect(service.create('user-1', { categoryId: '1', limit: 1000 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if category is not EXPENSE', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue({ type: 'INCOME' });
      await expect(service.create('user-1', { categoryId: '1', limit: 1000 })).rejects.toThrow(BadRequestException);
    });

    it('should create a budget', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue({ type: 'EXPENSE' });
      const dto = { categoryId: '1', limit: 1000 } as const;
      const result = { id: '1', ...dto, userId: 'user-1' };
      mockPrismaService.budget.create.mockResolvedValue(result);

      expect(await service.create('user-1', dto)).toEqual(result);
    });
  });

  describe('findAll', () => {
    it('should return budgets', async () => {
      const result = [{ id: '1', userId: 'user-1' }];
      mockPrismaService.budget.findMany.mockResolvedValue(result);

      expect(await service.findAll('user-1')).toEqual(result);
      expect(mockPrismaService.budget.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { category: true },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return budget if found', async () => {
      const result = { id: '1', userId: 'user-1' };
      mockPrismaService.budget.findFirst.mockResolvedValue(result);

      expect(await service.findOne('user-1', '1')).toEqual(result);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.budget.findFirst.mockResolvedValue(null);
      await expect(service.findOne('user-1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a budget', async () => {
      const dto = { limit: 2000 };
      const budget = { id: '1', userId: 'user-1' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(budget as any);
      mockPrismaService.budget.update.mockResolvedValue({ ...budget, ...dto });

      expect(await service.update('user-1', '1', dto)).toEqual({ ...budget, ...dto });
    });

    it('should validate category if categoryId is provided', async () => {
      const dto = { categoryId: '2' };
      const budget = { id: '1', userId: 'user-1' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(budget as any);
      mockPrismaService.category.findFirst.mockResolvedValue({ type: 'EXPENSE' });
      mockPrismaService.budget.update.mockResolvedValue({ ...budget, ...dto });

      expect(await service.update('user-1', '1', dto)).toEqual({ ...budget, ...dto });
      expect(mockPrismaService.category.findFirst).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a budget', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1' } as any);
      mockPrismaService.budget.delete.mockResolvedValue({ id: '1' });

      await service.remove('user-1', '1');
      expect(mockPrismaService.budget.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('reorder', () => {
    it('should throw NotFoundException if a budget is missing', async () => {
      mockPrismaService.budget.findMany.mockResolvedValue([]);
      
      await expect(service.reorder('user-1', { budgets: [{ id: '1', order: 1 }] })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if budget belongs to another user', async () => {
      mockPrismaService.budget.findMany.mockResolvedValue([{ id: '1', userId: 'other-user' }]);
      
      await expect(service.reorder('user-1', { budgets: [{ id: '1', order: 1 }] })).rejects.toThrow(ForbiddenException);
    });

    it('should reorder budgets', async () => {
      mockPrismaService.budget.findMany.mockResolvedValue([{ id: '1', userId: 'user-1' }]);
      mockPrismaService.$transaction.mockResolvedValue([{ id: '1', order: 2 }]);
      
      const result = await service.reorder('user-1', { budgets: [{ id: '1', order: 2 }] });
      expect(result).toEqual([{ id: '1', order: 2 }]);
    });
  });
});
