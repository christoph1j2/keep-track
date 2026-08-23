import { Test, TestingModule } from '@nestjs/testing';
import { HeuristicMatcherService } from './heuristic-matcher.service';
import { PrismaService } from '../prisma/prisma.service';
import type { Transaction } from '@prisma/client';

describe('HeuristicMatcherService', () => {
  let service: HeuristicMatcherService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  };

  const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 'tx-1',
    userId: 'user-1',
    title: 'Test',
    date: new Date(),
    amount: 100,
    originalAmount: 100,
    originalCurrency: 'CZK',
    exchangeRate: null,
    categoryId: null,
    isAiCategorized: false,
    bankReferenceId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeuristicMatcherService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HeuristicMatcherService>(HeuristicMatcherService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('match', () => {
    it('should return all transactions as unmatched when no categories exist', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { title: 'BILLA Praha', categoryId: 'cat-groceries' },
      ]);
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const tx1 = makeTx({ id: 'tx-1', title: 'BILLA Praha' });
      const tx2 = makeTx({ id: 'tx-2', title: 'Netflix' });

      const result = await service.match('user-1', [tx1, tx2]);

      expect(result).toEqual({
        matched: [],
        unmatched: [tx1, tx2],
        categories: [],
      });
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', categoryId: { not: null } },
        select: { title: true, categoryId: true },
        distinct: ['title', 'categoryId'],
      });
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { id: true, label: true },
      });
    });

    it('should match transactions by exact title (case-insensitive)', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { title: 'BILLA Praha', categoryId: 'cat-groceries' },
      ]);
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-groceries', label: 'Groceries' },
      ]);

      const tx = makeTx({ id: 'tx-1', title: '  billa praha  ' });

      const result = await service.match('user-1', [tx]);

      expect(result.matched).toEqual([
        {
          ...tx,
          categoryId: 'cat-groceries',
          isAiCategorized: false,
        },
      ]);
      expect(result.unmatched).toEqual([]);
    });

    it('should match transactions by starts-with when title >= 5 chars', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { title: 'Netflix Subscription', categoryId: 'cat-subs' },
        { title: 'Spotify', categoryId: 'cat-subs' },
      ]);
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-subs', label: 'Subscriptions' },
      ]);

      const tx1 = makeTx({ id: 'tx-1', title: 'Netflix' });
      const tx2 = makeTx({ id: 'tx-2', title: 'Spotify Premium' });

      const result = await service.match('user-1', [tx1, tx2]);

      expect(result.matched).toEqual([
        {
          ...tx1,
          categoryId: 'cat-subs',
          isAiCategorized: false,
        },
        {
          ...tx2,
          categoryId: 'cat-subs',
          isAiCategorized: false,
        },
      ]);
      expect(result.unmatched).toEqual([]);
    });

    it('should NOT fuzzy match short titles (< 5 chars)', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { title: 'KFC', categoryId: 'cat-food' },
        { title: 'Tesco Express', categoryId: 'cat-groceries' },
      ]);
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-food', label: 'Food' },
        { id: 'cat-groceries', label: 'Groceries' },
      ]);

      const tx1 = makeTx({ id: 'tx-1', title: 'KFC Airport' });
      const tx2 = makeTx({ id: 'tx-2', title: 'Tesc' });

      const result = await service.match('user-1', [tx1, tx2]);

      expect(result.matched).toEqual([]);
      expect(result.unmatched).toEqual([tx1, tx2]);
    });

    it('should put transactions in unmatched when no history match found', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { title: 'Supermarket', categoryId: 'cat-groceries' },
      ]);
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-groceries', label: 'Groceries' },
      ]);

      const tx = makeTx({ id: 'tx-1', title: 'Unknown Restaurant' });

      const result = await service.match('user-1', [tx]);

      expect(result.matched).toEqual([]);
      expect(result.unmatched).toEqual([tx]);
    });

    it('should put transactions in unmatched when matched category does not exist in user categories', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { title: 'Netflix', categoryId: 'deleted-category-id' },
      ]);
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-groceries', label: 'Groceries' },
      ]);

      const tx = makeTx({ id: 'tx-1', title: 'Netflix' });

      const result = await service.match('user-1', [tx]);

      expect(result.matched).toEqual([]);
      expect(result.unmatched).toEqual([tx]);
    });

    it('should return categories alongside results', async () => {
      const categories = [
        { id: 'cat-1', label: 'Groceries' },
        { id: 'cat-2', label: 'Utilities' },
      ];
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.category.findMany.mockResolvedValue(categories);

      const tx = makeTx({ id: 'tx-1', title: 'Test Transaction' });

      const result = await service.match('user-1', [tx]);

      expect(result.categories).toEqual(categories);
    });

    it('should match a title that has both null and valid categoryId history', async () => {
      mockPrismaService.transaction.findMany.mockImplementation(async (args: any) => {
        const data = [
          { title: 'Tesco', categoryId: null },
          { title: 'Tesco', categoryId: 'cat-groceries' },
        ];
        if (args.where?.categoryId?.not === null) {
          return data.filter(d => d.categoryId !== null);
        }
        return data;
      });
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-groceries', label: 'Groceries' },
      ]);

      const tx = makeTx({ id: 'tx-1', title: 'Tesco' });

      const result = await service.match('user-1', [tx]);

      expect(result.matched).toEqual([
        {
          ...tx,
          categoryId: 'cat-groceries',
          isAiCategorized: false,
        },
      ]);
      expect(result.unmatched).toEqual([]);
    });
  });
});
