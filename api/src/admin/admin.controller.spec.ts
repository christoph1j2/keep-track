import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ParseEnumPipe } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    getStats: jest.fn(),
    getUsers: jest.fn(),
    getUserDetails: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
    broadcastNotification: jest.fn(),
    cleanupOldImportJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockAdminService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateUserRole', () => {
    it('should delegate valid Role update to AdminService', async () => {
      const mockResult = { email: 'user@test.com', username: 'user', role: Role.ADMIN };
      mockAdminService.updateUserRole.mockResolvedValue(mockResult);

      const result = await controller.updateUserRole('user-123', Role.ADMIN);
      expect(result).toEqual(mockResult);
      expect(service.updateUserRole).toHaveBeenCalledWith('user-123', Role.ADMIN);
    });

    it('should reject invalid role input when processed via ParseEnumPipe', async () => {
      const pipe = new ParseEnumPipe(Role);
      await expect(pipe.transform('ROOT', { type: 'body', data: 'newRole' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
