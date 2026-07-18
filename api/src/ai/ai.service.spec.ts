import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notification/notifications.gateway';
import { NotificationService } from '../notification/notification.service';

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

  const mockNotificationsGateway = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  const mockNotificationService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
        { provide: NotificationService, useValue: mockNotificationService },
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

      expect(mockNotificationsGateway.server.to).toHaveBeenCalledWith('user-1');
      expect(mockNotificationsGateway.server.emit).toHaveBeenCalledWith('import_finished', expect.objectContaining({ status: 'success' }));
    });

    it('should process and notify error on failure', async () => {
      jest.spyOn(service, 'processBatch').mockRejectedValue(new Error('fail'));
      await service.processBatchAndNotify('user-1', []);

      expect(mockNotificationsGateway.server.emit).toHaveBeenCalledWith('import_finished', expect.objectContaining({ status: 'error' }));
    });
  });

  describe('Import Jobs', () => {
    it('should create import job', async () => {
      mockPrismaService.importJob.create.mockResolvedValue({ id: 'job-1' });
      const result = await service.createImportJob('user-1', []);
      expect(result.id).toBe('job-1');
    });

    it('should delete import job', async () => {
      mockPrismaService.importJob.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.deleteJob('user-1', 'job-1');
      expect(result.success).toBe(true);
    });

    it('should get pending job', async () => {
      mockPrismaService.importJob.findFirst.mockResolvedValue({ id: 'job-1', data: [] });
      const result = await service.getPendingJobForUser('user-1');
      expect(result?.jobId).toBe('job-1');
    });

    it('should process job in background', async () => {
      jest.spyOn(service, 'processBatch').mockResolvedValue([]);
      mockPrismaService.importJob.update.mockResolvedValue({});

      await service.processJobInBackground('job-1', 'user-1', []);
      expect(mockPrismaService.importJob.update).toHaveBeenCalled();
      expect(mockNotificationsGateway.server.emit).toHaveBeenCalledWith('import_finished', expect.objectContaining({ status: 'success' }));
      expect(mockNotificationService.create).toHaveBeenCalled();
    });

    it('should handle error in background processing', async () => {
      jest.spyOn(service, 'processBatch').mockRejectedValue(new Error('fail'));
      
      await service.processJobInBackground('job-1', 'user-1', []);
      expect(mockPrismaService.importJob.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'FAILED' } }));
      expect(mockNotificationsGateway.server.emit).toHaveBeenCalledWith('import_finished', expect.objectContaining({ status: 'error' }));
    });
  });
});
