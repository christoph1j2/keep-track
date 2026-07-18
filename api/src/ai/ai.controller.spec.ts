import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TransactionService } from '../transaction/transaction.service';

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn(),
}));

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;

  const mockAiService = {
    processBatchAndNotify: jest.fn().mockResolvedValue(true),
    createImportJob: jest.fn(),
    processJobInBackground: jest.fn().mockResolvedValue(true),
    getPendingJobForUser: jest.fn(),
    deleteJob: jest.fn(),
  };

  const mockTransactionService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: mockAiService },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get<AiService>(AiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('categorizeBatch', () => {
    it('should start batch processing', () => {
      const dto = { transactions: [{ id: '1', title: 'Test', date: new Date().toISOString(), amount: 100 }] };
      const req = { user: { id: 'user-1' } } as any;

      const result = controller.categorizeBatch(req, dto as any);
      expect(result.message).toBe('Batch processing started');
      expect(service.processBatchAndNotify).toHaveBeenCalled();
    });
  });

  describe('startImport', () => {
    it('should start import job', async () => {
      const req = { user: { id: 'user-1' } } as any;
      mockAiService.createImportJob.mockResolvedValue({ id: 'job-1' });

      const result = await controller.startImport(req, []);
      expect(result.message).toBe('Import job started');
      expect(result.jobId).toBe('job-1');
      expect(service.createImportJob).toHaveBeenCalledWith('user-1', []);
      expect(service.processJobInBackground).toHaveBeenCalledWith('job-1', 'user-1', []);
    });
  });

  describe('getPendingJob', () => {
    it('should call getPendingJobForUser', async () => {
      const req = { user: { id: 'user-1' } } as any;
      await controller.getPendingJob(req);
      expect(service.getPendingJobForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('deleteJob', () => {
    it('should call deleteJob', async () => {
      const req = { user: { id: 'user-1' } } as any;
      await controller.deleteJob(req, 'job-1');
      expect(service.deleteJob).toHaveBeenCalledWith('user-1', 'job-1');
    });
  });
});
