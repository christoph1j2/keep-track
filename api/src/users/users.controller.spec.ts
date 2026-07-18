import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    deleteAccount: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', () => {
      const dto = { email: 'test@test.com', username: 'test', password: 'password' };
      controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProfile', () => {
    it('should call service.findOne', () => {
      const req = { user: { id: 'user-1' } } as any;
      controller.getProfile(req);
      expect(service.findOne).toHaveBeenCalledWith('user-1');
    });
  });

  describe('update', () => {
    it('should call service.update', () => {
      const dto = { username: 'updated' };
      const req = { user: { id: 'user-1' } } as any;
      controller.update(req, dto);
      expect(service.update).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.deleteAccount', () => {
      const req = { user: { id: 'user-1' } } as any;
      controller.remove(req);
      expect(service.deleteAccount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('changePassword', () => {
    it('should call service.changePassword', () => {
      const dto = { oldPassword: 'old', newPassword: 'new' };
      const req = { user: { id: 'user-1' } } as any;
      controller.changePassword(req, dto);
      expect(service.changePassword).toHaveBeenCalledWith('user-1', dto);
    });
  });
});
