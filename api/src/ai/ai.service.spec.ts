import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notification/notification.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';

jest.mock('@openrouter/sdk', () => {
  return {
    OpenRouter: jest.fn().mockImplementation(() => ({
      chat: {
        send: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify([{ title: 'Test', categoryId: 'cat-1' }])
            }
          }]
        }),
      },
    })),
  };
});

describe('AiService', () => {
  let service: AiService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ baseCurrency: 'CZK' }),
    },
    transaction: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    importJob: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockEventsGateway = {
    emitToUser: jest.fn(),
    broadcast: jest.fn(),
  };

  const mockNotificationService = {
    create: jest.fn(),
  };

  const mockExchangeRateService = {
    getHistoricalRates: jest.fn(),
  };

  beforeEach(async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ExchangeRateService, useValue: mockExchangeRateService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processBatch', () => {
    it('should return empty array if no transactions', async () => {
      const result = await service.processBatch('user-1', []);
      expect(result).toEqual([]);
    });

    it('should map categories locally if match found', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([{ title: 'Test', categoryId: 'cat-1' }]);
      mockPrismaService.category.findMany.mockResolvedValue([{ id: 'cat-1', label: 'Test Cat' }]);

      const tx = { id: '1', title: 'Test', date: new Date(), amount: 100 } as any;
      const result = await service.processBatch('user-1', [tx]);

      expect(result[0].categoryId).toBe('cat-1');
      expect(result[0].isAiCategorized).toBe(false);
    });

    it('should not call OpenRouter if no categories found', async () => {
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const tx = { id: '1', title: 'Test', date: new Date(), amount: 100 } as any;
      const result = await service.processBatch('user-1', [tx]);

      expect(result[0].categoryId).toBe(null);
      expect(result.every((r) => r.isAiCategorized)).toBe(false);
    });

    it('should not call OpenRouter if no API key is set', async () => {
      delete process.env.OPENROUTER_API_KEY;
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.category.findMany.mockResolvedValue([{ id: 'cat-1', label: 'Test Cat' }]);

      const tx = { id: '1', title: 'Test', date: new Date(), amount: 100 } as any;
      const result = await service.processBatch('user-1', [tx]);

      expect(result[0].categoryId).toBe(null);
      expect(result.every((r) => r.isAiCategorized)).toBe(false);
    });
  });

  describe('processBatchAndNotify', () => {
    it('should process and notify success', async () => {
      jest.spyOn(service, 'processBatch').mockResolvedValue([]);
      await service.processBatchAndNotify('user-1', []);

      expect(mockEventsGateway.emitToUser).toHaveBeenCalledWith('user-1', 'import_finished', expect.objectContaining({ status: 'success' }));
    });

    it('should process and notify error on failure', async () => {
      jest.spyOn(service, 'processBatch').mockRejectedValue(new Error('fail'));
      await service.processBatchAndNotify('user-1', []);

      expect(mockEventsGateway.emitToUser).toHaveBeenCalledWith('user-1', 'import_finished', expect.objectContaining({ status: 'error' }));
    });
  });
});
