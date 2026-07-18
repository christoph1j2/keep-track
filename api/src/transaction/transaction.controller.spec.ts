import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionController', () => {
  let controller: TransactionController;
  let service: TransactionService;

  const mockTransactionService = {
    create: jest.fn(),
    createBatch: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    service = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', () => {
      const dto: CreateTransactionDto = { amount: 100, name: 'Test', date: new Date(), type: 'EXPENSE' };
      const req = { user: { id: 'user-1' } } as any;
      controller.create(dto, req);
      expect(service.create).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('createBatch', () => {
    it('should call service.createBatch', () => {
      const dto = { transactions: [{ amount: 100, name: 'Test', date: new Date(), type: 'EXPENSE' as const }] };
      const req = { user: { id: 'user-1' } } as any;
      controller.createBatch(dto, req);
      expect(service.createBatch).toHaveBeenCalledWith('user-1', dto.transactions);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', () => {
      const req = { user: { id: 'user-1' } } as any;
      controller.findAll(req);
      expect(service.findAll).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', () => {
      const req = { user: { id: 'user-1' } } as any;
      controller.findOne('1', req);
      expect(service.findOne).toHaveBeenCalledWith('user-1', '1');
    });
  });

  describe('update', () => {
    it('should call service.update', () => {
      const dto = { amount: 200 };
      const req = { user: { id: 'user-1' } } as any;
      controller.update('1', dto, req);
      expect(service.update).toHaveBeenCalledWith('user-1', '1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove', () => {
      const req = { user: { id: 'user-1' } } as any;
      controller.remove('1', req);
      expect(service.remove).toHaveBeenCalledWith('user-1', '1');
    });
  });
});
