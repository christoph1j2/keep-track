import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notification/notification.service';
import {
  CategorisationService,
  ProcessedTransaction,
} from '../categorisation/categorisation.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { Transaction } from '@prisma/client/index-browser';

describe('ImportService', () => {
  let service: ImportService;

  const mockPrismaService = {
    importJob: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  };

  const mockEventsGateway = {
    emitToUser: jest.fn(),
  };

  const mockNotificationService = {
    create: jest.fn(),
  };

  const mockCategorisationService = {
    categorise: jest.fn(),
  };

  const mockExchangeRateService = {
    getHistoricalRates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: CategorisationService, useValue: mockCategorisationService },
        { provide: ExchangeRateService, useValue: mockExchangeRateService },
      ],
    }).compile();

    service = module.get<ImportService>(ImportService);
    mockPrismaService.transaction.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createImportJob', () => {
    it('should create a job with PROCESSING status', async () => {
      const userId = 'user-1';
      const initialData = [{ title: 'Tx 1', amount: 100 }];
      const expectedResult = {
        id: 'job-1',
        userId,
        status: 'PROCESSING',
        data: initialData,
      };

      mockPrismaService.importJob.create.mockResolvedValue(expectedResult);

      const result = await service.createImportJob(userId, initialData);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.importJob.create).toHaveBeenCalledWith({
        data: {
          userId,
          status: 'PROCESSING',
          data: initialData,
        },
      });
    });
  });

  describe('deleteJob', () => {
    it('should delete and return success', async () => {
      mockPrismaService.importJob.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteJob('user-1', 'job-1');

      expect(result).toEqual({ success: true });
      expect(mockPrismaService.importJob.deleteMany).toHaveBeenCalledWith({
        where: { id: 'job-1', userId: 'user-1' },
      });
    });
  });

  describe('getPendingJobForUser', () => {
    it('should return pending job', async () => {
      const mockJob = {
        id: 'job-1',
        data: [{ title: 'Tx 1', amount: 100 }],
      };

      mockPrismaService.importJob.findFirst.mockResolvedValue(mockJob);

      const result = await service.getPendingJobForUser('user-1');

      expect(result).toEqual({
        jobId: 'job-1',
        transactions: mockJob.data,
      });
      expect(mockPrismaService.importJob.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'READY_FOR_REVIEW' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return null when no pending job', async () => {
      mockPrismaService.importJob.findFirst.mockResolvedValue(null);

      const result = await service.getPendingJobForUser('user-1');

      expect(result).toBeNull();
    });

    it('should filter by jobId when provided', async () => {
      const mockJob = { id: 'job-123', data: [{ title: 'Tx 1' }] };

      mockPrismaService.importJob.findFirst.mockResolvedValue(mockJob);

      await service.getPendingJobForUser('user-1', 'job-123');

      expect(mockPrismaService.importJob.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'READY_FOR_REVIEW', id: 'job-123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('processJobInBackground', () => {
    it('should process successfully (categorise, update job, create notification, emit WS event)', async () => {
      const jobId = 'job-1';
      const userId = 'user-1';
      const txns = [
        {
          title: 'Grocery',
          amount: 250,
          originalAmount: 250,
          originalCurrency: 'CZK',
          date: '2026-01-15T12:00:00Z',
        },
      ] as unknown as Transaction[];
      const categorisedData = [
        { ...txns[0], categoryId: 'cat-1', isAiCategorized: true },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue({
        baseCurrency: 'CZK',
      });
      mockCategorisationService.categorise.mockResolvedValue(categorisedData);
      mockPrismaService.importJob.update.mockResolvedValue({});
      mockNotificationService.create.mockResolvedValue({});

      await service.processJobInBackground(jobId, userId, txns);

      expect(mockCategorisationService.categorise).toHaveBeenCalledWith(
        userId,
        txns,
        true,
      );
      expect(mockPrismaService.importJob.update).toHaveBeenCalledWith({
        where: { id: jobId },
        data: { status: 'READY_FOR_REVIEW', data: categorisedData },
      });
      expect(mockNotificationService.create).toHaveBeenCalledWith(
        userId,
        'IMPORT_READY',
        `Import dokončen (${categorisedData.length} transakcí)`,
        'Transakce byly analyzovány a čekají na vaše schválení.',
        { jobId },
      );
      expect(mockEventsGateway.emitToUser).toHaveBeenCalledWith(
        userId,
        'import_finished',
        { status: 'success', jobId, data: categorisedData },
      );
    });

    it('should handle errors (update job to FAILED, emit error WS event)', async () => {
      const jobId = 'job-1';
      const userId = 'user-1';

      mockPrismaService.user.findUnique.mockRejectedValue(
        new Error('DB error'),
      );
      mockPrismaService.importJob.update.mockResolvedValue({});

      await service.processJobInBackground(jobId, userId, []);

      expect(mockPrismaService.importJob.update).toHaveBeenCalledWith({
        where: { id: jobId },
        data: { status: 'FAILED' },
      });
      expect(mockEventsGateway.emitToUser).toHaveBeenCalledWith(
        userId,
        'import_finished',
        {
          status: 'error',
          jobId,
          message:
            'An error occurred during processing. Please try again later.',
        },
      );
    });

    it('should convert foreign currency transactions using historical rates', async () => {
      const jobId = 'job-1';
      const userId = 'user-1';
      const txns = [
        {
          date: '2026-01-15T10:00:00.000Z',
          originalAmount: 10,
          originalCurrency: 'EUR',
          amount: 0,
          exchangeRate: null as number | null,
        },
        {
          date: '2026-01-15T12:00:00.000Z',
          originalAmount: 100,
          originalCurrency: 'CZK',
        },
      ] as unknown as Transaction[];

      mockPrismaService.user.findUnique.mockResolvedValue({
        baseCurrency: 'CZK',
      });
      mockExchangeRateService.getHistoricalRates.mockResolvedValue({
        EUR: 0.04,
      });
      mockCategorisationService.categorise.mockImplementation(
        async (_userId, t) => (await t) as ProcessedTransaction[],
      );
      mockPrismaService.importJob.update.mockResolvedValue({});
      mockNotificationService.create.mockResolvedValue({});

      await service.processJobInBackground(jobId, userId, txns);

      // EUR transaction should be converted
      expect(txns[0].amount).toBe(250); // 10 / 0.04
      expect(txns[0].exchangeRate).toBe(25); // 1 / 0.04

      expect(mockExchangeRateService.getHistoricalRates).toHaveBeenCalledWith(
        '2026-01-15',
        'CZK',
      );
    });
  });

  describe('filterDuplicates', () => {
    it('should return empty array when transactions is empty', async () => {
      const result = await service.filterDuplicates('user-1', []);
      expect(result).toEqual([]);
      expect(mockPrismaService.transaction.findMany).not.toHaveBeenCalled();
    });

    it('should correctly consume matches from existing DB transactions using frequency counter', async () => {
      const userId = 'user-1';
      const existingInDb = [
        {
          id: 'tx-1',
          userId,
          title: 'eshop.cd',
          amount: 150,
          date: new Date('2026-01-15T08:00:00.000Z'),
        },
      ] as Transaction[];

      mockPrismaService.transaction.findMany.mockResolvedValue(existingInDb);

      const incoming = [
        {
          title: 'eshop.cd',
          amount: 150,
          date: '2026-01-15T09:00:00.000Z',
        },
        {
          title: 'eshop.cd',
          amount: 150,
          date: '2026-01-15T17:00:00.000Z',
        },
      ] as unknown as Transaction[];

      const result = await service.filterDuplicates(userId, incoming);

      // 1 existing in DB matching key -> 1st incoming skipped, 2nd incoming kept
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(incoming[1]);
    });

    it('should keep all identical incoming transactions if DB has none of them', async () => {
      const userId = 'user-1';
      mockPrismaService.transaction.findMany.mockResolvedValue([]);

      const incoming = [
        {
          title: 'eshop.cd',
          amount: 150,
          date: '2026-01-15T09:00:00.000Z',
        },
        {
          title: 'eshop.cd',
          amount: 150,
          date: '2026-01-15T17:00:00.000Z',
        },
      ] as unknown as Transaction[];

      const result = await service.filterDuplicates(userId, incoming);

      expect(result).toHaveLength(2);
    });

    it('should correctly filter foreign currency duplicates using originalAmount and originalCurrency before currency conversion', async () => {
      const userId = 'user-1';
      // In DB: existing transaction has converted amount (250 CZK) but originalAmount (10) & originalCurrency ('EUR')
      const existingInDb = [
        {
          id: 'tx-1',
          userId,
          title: 'Hotel Paris',
          amount: 250, // Converted to baseCurrency CZK in DB
          originalAmount: 10,
          originalCurrency: 'EUR',
          date: new Date('2026-01-15T08:00:00.000Z'),
        },
      ] as Transaction[];

      mockPrismaService.transaction.findMany.mockResolvedValue(existingInDb);

      // Incoming: before currency conversion, amount is not yet converted (e.g. 0 or 10)
      const incoming = [
        {
          title: 'Hotel Paris',
          amount: 0, // Unconverted before currency conversion step
          originalAmount: 10,
          originalCurrency: 'EUR',
          date: '2026-01-15T08:00:00.000Z',
        },
      ] as unknown as Transaction[];

      const result = await service.filterDuplicates(userId, incoming);

      // Should be filtered out as duplicate because originalAmount (10) and originalCurrency ('EUR') match
      expect(result).toHaveLength(0);
    });
  });
});
