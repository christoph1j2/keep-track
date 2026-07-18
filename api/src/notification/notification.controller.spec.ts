import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    findAllUnread: jest.fn(),
    markAsRead: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAllUnread', () => {
      const req = { user: { id: 'user-1' } } as any;
      controller.findAll(req);
      expect(service.findAllUnread).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('should call markAsRead', () => {
      const req = { user: { id: 'user-1' } } as any;
      controller.markAsRead('1', req);
      expect(service.markAsRead).toHaveBeenCalledWith('user-1', '1');
    });
  });

  describe('remove', () => {
    it('should call remove', () => {
      const req = { user: { id: 'user-1' } } as any;
      controller.remove('1', req);
      expect(service.remove).toHaveBeenCalledWith('user-1', '1');
    });
  });
});
