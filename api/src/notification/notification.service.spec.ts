import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create notification', async () => {
      mockPrismaService.notification.create.mockResolvedValue({ id: '1' });
      const result = await service.create('user-1', 'TEST', 'Test Title', 'Test Msg', { some: 'data' });
      expect(result.id).toBe('1');
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'TEST',
          title: 'Test Title',
          message: 'Test Msg',
          metadata: { some: 'data' },
        },
      });
    });
  });

  describe('findAllUnread', () => {
    it('should return unread notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAllUnread('user-1');
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('markAsRead', () => {
    it('should mark as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.markAsRead('user-1', '1');
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('remove', () => {
    it('should remove notification', async () => {
      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.remove('user-1', '1');
      expect(result).toEqual({ count: 1 });
    });
  });
});
