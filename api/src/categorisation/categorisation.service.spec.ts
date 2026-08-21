import { Test, TestingModule } from '@nestjs/testing';
import { CategorisationService } from './categorisation.service';
import { HeuristicMatcherService } from './heuristic-matcher.service';
import { LLM_PROVIDER, type LlmProvider } from './providers/llm-provider.interface';
import { Transaction } from '@prisma/client';

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

describe('CategorisationService', () => {
  let service: CategorisationService;
  let heuristicMatcher: HeuristicMatcherService;
  let llmProvider: LlmProvider;

  const mockHeuristicMatcherService = {
    match: jest.fn(),
  };

  const mockLlmProvider = {
    categorise: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategorisationService,
        { provide: HeuristicMatcherService, useValue: mockHeuristicMatcherService },
        { provide: LLM_PROVIDER, useValue: mockLlmProvider },
      ],
    }).compile();

    service = module.get<CategorisationService>(CategorisationService);
    heuristicMatcher = module.get<HeuristicMatcherService>(HeuristicMatcherService);
    llmProvider = module.get<LlmProvider>(LLM_PROVIDER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('categorise', () => {
    it('should return heuristic matches + unmatched with null categoryId when useAi=false', async () => {
      const matchedTx = makeTx({
        id: 'tx-1',
        title: 'Matched 1',
        categoryId: 'cat-1',
        isAiCategorized: false,
      });
      const unmatchedTx = makeTx({
        id: 'tx-2',
        title: 'Unmatched 2',
        categoryId: null,
        isAiCategorized: false,
      });

      mockHeuristicMatcherService.match.mockResolvedValue({
        matched: [matchedTx],
        unmatched: [unmatchedTx],
        categories: [{ id: 'cat-1', label: 'Groceries' }],
      });

      const result = await service.categorise('user-1', [matchedTx, unmatchedTx], false);

      expect(result).toEqual([
        matchedTx,
        { ...unmatchedTx, categoryId: null, isAiCategorized: false },
      ]);
      expect(mockHeuristicMatcherService.match).toHaveBeenCalledWith('user-1', [
        matchedTx,
        unmatchedTx,
      ]);
      expect(mockLlmProvider.categorise).not.toHaveBeenCalled();
    });

    it('should return early when no categories returned from heuristic matcher', async () => {
      const matchedTx = makeTx({
        id: 'tx-1',
        title: 'Matched 1',
        categoryId: 'cat-1',
        isAiCategorized: false,
      });
      const unmatchedTx = makeTx({
        id: 'tx-2',
        title: 'Unmatched 2',
      });

      mockHeuristicMatcherService.match.mockResolvedValue({
        matched: [matchedTx],
        unmatched: [unmatchedTx],
        categories: [],
      });

      const result = await service.categorise('user-1', [matchedTx, unmatchedTx], true);

      expect(result).toEqual([
        matchedTx,
        { ...unmatchedTx, categoryId: null, isAiCategorized: false },
      ]);
      expect(mockLlmProvider.categorise).not.toHaveBeenCalled();
    });

    it('should return early when all transactions matched by heuristics (unmatched is empty)', async () => {
      const matchedTx = makeTx({
        id: 'tx-1',
        title: 'Matched 1',
        categoryId: 'cat-1',
        isAiCategorized: false,
      });

      mockHeuristicMatcherService.match.mockResolvedValue({
        matched: [matchedTx],
        unmatched: [],
        categories: [{ id: 'cat-1', label: 'Groceries' }],
      });

      const result = await service.categorise('user-1', [matchedTx], true);

      expect(result).toEqual([matchedTx]);
      expect(mockLlmProvider.categorise).not.toHaveBeenCalled();
    });

    it('should call LLM provider with deduplicated normalized titles when useAi=true', async () => {
      const tx1 = makeTx({ id: 'tx-1', title: 'Albert s.r.o. 123' });
      const tx2 = makeTx({ id: 'tx-2', title: 'Albert 456' });
      const categories = [{ id: 'cat-1', label: 'Groceries' }];

      mockHeuristicMatcherService.match.mockResolvedValue({
        matched: [],
        unmatched: [tx1, tx2],
        categories,
      });

      mockLlmProvider.categorise.mockResolvedValue([
        { title: 'albert', categoryId: 'cat-1' },
      ]);

      await service.categorise('user-1', [tx1, tx2], true);

      expect(mockLlmProvider.categorise).toHaveBeenCalledTimes(1);
      expect(mockLlmProvider.categorise).toHaveBeenCalledWith(['albert'], categories);
    });

    it('should map LLM results back to original transactions correctly', async () => {
      const matchedTx = makeTx({
        id: 'tx-0',
        title: 'Rent',
        categoryId: 'cat-rent',
        isAiCategorized: false,
      });
      const tx1 = makeTx({ id: 'tx-1', title: 'Albert 1' });
      const tx2 = makeTx({ id: 'tx-2', title: 'Shell 1' });
      const tx3 = makeTx({ id: 'tx-3', title: 'Albert 2' });
      const categories = [
        { id: 'cat-groceries', label: 'Groceries' },
        { id: 'cat-fuel', label: 'Fuel' },
      ];

      mockHeuristicMatcherService.match.mockResolvedValue({
        matched: [matchedTx],
        unmatched: [tx1, tx2, tx3],
        categories,
      });

      mockLlmProvider.categorise.mockResolvedValue([
        { title: 'albert', categoryId: 'cat-groceries' },
        { title: 'shell', categoryId: 'cat-fuel' },
      ]);

      const result = await service.categorise('user-1', [matchedTx, tx1, tx2, tx3], true);

      expect(result).toEqual([
        matchedTx,
        { ...tx1, categoryId: 'cat-groceries', isAiCategorized: true },
        { ...tx2, categoryId: 'cat-fuel', isAiCategorized: true },
        { ...tx3, categoryId: 'cat-groceries', isAiCategorized: true },
      ]);
    });

    it('should set isAiCategorized=true only when LLM returned a categoryId', async () => {
      const tx1 = makeTx({ id: 'tx-1', title: 'Albert' });
      const tx2 = makeTx({ id: 'tx-2', title: 'Unknown Merchant' });
      const categories = [{ id: 'cat-1', label: 'Groceries' }];

      mockHeuristicMatcherService.match.mockResolvedValue({
        matched: [],
        unmatched: [tx1, tx2],
        categories,
      });

      mockLlmProvider.categorise.mockResolvedValue([
        { title: 'albert', categoryId: 'cat-1' },
        { title: 'unknown merchant', categoryId: null },
      ]);

      const result = await service.categorise('user-1', [tx1, tx2]);

      expect(result[0].isAiCategorized).toBe(true);
      expect(result[1].isAiCategorized).toBe(false);
    });

    it('should handle LLM returning null categoryId for some titles', async () => {
      const tx1 = makeTx({ id: 'tx-1', title: 'Netflix' });
      const tx2 = makeTx({ id: 'tx-2', title: 'Mystery Merchant' });
      const categories = [{ id: 'cat-sub', label: 'Subscriptions' }];

      mockHeuristicMatcherService.match.mockResolvedValue({
        matched: [],
        unmatched: [tx1, tx2],
        categories,
      });

      mockLlmProvider.categorise.mockResolvedValue([
        { title: 'netflix', categoryId: 'cat-sub' },
        { title: 'mystery merchant', categoryId: null },
      ]);

      const result = await service.categorise('user-1', [tx1, tx2], true);

      expect(result).toEqual([
        { ...tx1, categoryId: 'cat-sub', isAiCategorized: true },
        { ...tx2, categoryId: null, isAiCategorized: false },
      ]);
    });
  });
});
