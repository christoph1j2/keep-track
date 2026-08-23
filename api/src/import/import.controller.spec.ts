import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { StartImportDto } from './dto/start-import.dto';

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
    describe('validation', () => {
      const validationPipe = new ValidationPipe({
        transform: true,
        whitelist: true,
      });
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: StartImportDto,
      };

      it('should throw BadRequestException when transactions is not an array', async () => {
        await expect(
          validationPipe.transform({ transactions: 'invalid' }, metadata),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when transactions contain invalid items', async () => {
        await expect(
          validationPipe.transform(
            { transactions: [{ title: 'Invalid' }] },
            metadata,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('should pass validation for valid transaction DTO', async () => {
        const validPayload = {
          transactions: [
            {
              title: 'Albert',
              date: '2026-06-22T10:00:00Z',
              amount: 250,
            },
          ],
        };
        const result = await validationPipe.transform(validPayload, metadata);
        expect(result).toBeDefined();
        expect(result.transactions).toHaveLength(1);
      });
    });

    it('should create job and start background processing', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const transactions = [{ title: 'Salary', amount: 50000 }] as any;
      const job = { id: 'job-123', status: 'PROCESSING', data: transactions };

      mockImportService.createImportJob.mockResolvedValue(job);
      mockImportService.processJobInBackground.mockResolvedValue(undefined);

      await controller.startImport(req, { transactions });

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

    it('should pass explicit useAi=false to processJobInBackground', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const transactions = [{ title: 'Salary', amount: 50000 }] as any;
      const job = { id: 'job-123', status: 'PROCESSING', data: transactions };

      mockImportService.createImportJob.mockResolvedValue(job);
      mockImportService.processJobInBackground.mockResolvedValue(undefined);

      await controller.startImport(req, { transactions, useAi: false });

      expect(service.createImportJob).toHaveBeenCalledWith(
        'user-1',
        transactions,
      );
      expect(service.processJobInBackground).toHaveBeenCalledWith(
        'job-123',
        'user-1',
        transactions,
        false,
      );
    });

    it('should return jobId in response', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const transactions = [{ title: 'Salary', amount: 50000 }] as any;
      const job = { id: 'job-123', status: 'PROCESSING', data: transactions };

      mockImportService.createImportJob.mockResolvedValue(job);
      mockImportService.processJobInBackground.mockResolvedValue(undefined);

      const result = await controller.startImport(req, { transactions });

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
