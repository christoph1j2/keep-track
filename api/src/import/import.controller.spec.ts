import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

describe('ImportController', () => {
  let controller: ImportController;
  let service: ImportService;

  const mockImportService = {
    createImportJob: jest.fn(),
    processJobInBackground: jest.fn(),
    getPendingJobForUser: jest.fn(),
    deleteJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportController],
      providers: [
        {
          provide: ImportService,
          useValue: mockImportService,
        },
      ],
    }).compile();

    controller = module.get<ImportController>(ImportController);
    service = module.get<ImportService>(ImportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startImport', () => {
    it('should throw BadRequestException when transactions is not an array', async () => {
      const req = { user: { id: 'user-1' } } as any;

      await expect(
        controller.startImport(req, 'invalid' as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.startImport(req, 123 as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.startImport(req, null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when transactions contains non-objects', async () => {
      const req = { user: { id: 'user-1' } } as any;

      await expect(
        controller.startImport(req, ['not-an-object'] as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.startImport(req, [null] as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.startImport(req, [{ title: 'Valid' }, 123] as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create job and start background processing', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const transactions = [{ title: 'Salary', amount: 50000 }];
      const job = { id: 'job-123', status: 'PROCESSING', data: transactions };

      mockImportService.createImportJob.mockResolvedValue(job);
      mockImportService.processJobInBackground.mockResolvedValue(undefined);

      await controller.startImport(req, transactions);

      expect(service.createImportJob).toHaveBeenCalledWith(
        'user-1',
        transactions,
      );
      expect(service.processJobInBackground).toHaveBeenCalledWith(
        'job-123',
        'user-1',
        transactions,
        true,
      );
    });

    it('should return jobId in response', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const transactions = [{ title: 'Salary', amount: 50000 }];
      const job = { id: 'job-123', status: 'PROCESSING', data: transactions };

      mockImportService.createImportJob.mockResolvedValue(job);
      mockImportService.processJobInBackground.mockResolvedValue(undefined);

      const result = await controller.startImport(req, transactions);

      expect(result).toEqual({
        message: 'Import job started',
        jobId: 'job-123',
      });
    });
  });

  describe('getPendingJob', () => {
    it('should call getPendingJobForUser with userId', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const mockResult = {
        jobId: 'job-123',
        transactions: [{ title: 'Test' }],
      };
      mockImportService.getPendingJobForUser.mockResolvedValue(mockResult);

      const result = await controller.getPendingJob(req);

      expect(service.getPendingJobForUser).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
      expect(result).toEqual(mockResult);
    });

    it('should pass jobId query param when provided', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const jobId = 'job-456';
      const mockResult = {
        jobId: 'job-456',
        transactions: [{ title: 'Test' }],
      };
      mockImportService.getPendingJobForUser.mockResolvedValue(mockResult);

      const result = await controller.getPendingJob(req, jobId);

      expect(service.getPendingJobForUser).toHaveBeenCalledWith(
        'user-1',
        jobId,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteJob', () => {
    it('should call deleteJob with userId and jobId', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const jobId = 'job-123';
      const mockResult = { success: true };
      mockImportService.deleteJob.mockResolvedValue(mockResult);

      const result = await controller.deleteJob(req, jobId);

      expect(service.deleteJob).toHaveBeenCalledWith('user-1', jobId);
      expect(result).toEqual(mockResult);
    });
  });
});
