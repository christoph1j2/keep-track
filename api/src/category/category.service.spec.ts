import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { name: 'Test', color: '#000000', icon: 'test' };
      const result = { id: '1', ...dto, userId: 'user-1' };
      mockPrismaService.category.create.mockResolvedValue(result);

      expect(await service.create('user-1', dto as any)).toEqual(result);
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all categories for a user', async () => {
      const result = [{ id: '1', name: 'Test', userId: 'user-1' }];
      mockPrismaService.category.findMany.mockResolvedValue(result);

      expect(await service.findAll('user-1')).toEqual(result);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category if found', async () => {
      const result = { id: '1', name: 'Test', userId: 'user-1' };
      mockPrismaService.category.findFirst.mockResolvedValue(result);

      expect(await service.findOne('user-1', '1')).toEqual(result);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const dto = { name: 'Updated' };
      const category = { id: '1', name: 'Test', userId: 'user-1' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(category as any);
      mockPrismaService.category.update.mockResolvedValue({ ...category, ...dto });

      expect(await service.update('user-1', '1', dto as any)).toEqual({ ...category, ...dto });
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
    });

    it('should throw BadRequestException if category is its own parent', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({} as any);

      await expect(service.update('user-1', '1', { parentId: '1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on circular dependency (A -> B -> A)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1', userId: 'user-1' } as any);
      mockPrismaService.category.findUnique.mockResolvedValue({ parentId: '1' });

      await expect(service.update('user-1', '1', { parentId: '2' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on deep circular dependency', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1', userId: 'user-1' } as any);
      
      let callCount = 0;
      mockPrismaService.category.findUnique.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ parentId: '3' });
        if (callCount === 2) return Promise.resolve({ parentId: '2' }); // Loop!
        return Promise.resolve(null);
      });

      await expect(service.update('user-1', '1', { parentId: '2' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1' } as any);
      mockPrismaService.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      });

      await service.remove('user-1', '1');
      expect(mockPrismaService.category.updateMany).toHaveBeenCalledWith({
        where: { parentId: '1', userId: 'user-1' },
        data: { parentId: null },
      });
      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('reorder', () => {
    it('should throw NotFoundException if a category is missing', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);
      
      await expect(service.reorder('user-1', { categories: [{ id: '1', order: 1 }] })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if category belongs to another user', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([{ id: '1', userId: 'other-user' }]);
      
      await expect(service.reorder('user-1', { categories: [{ id: '1', order: 1 }] })).rejects.toThrow(ForbiddenException);
    });

    it('should reorder categories', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([{ id: '1', userId: 'user-1' }]);
      mockPrismaService.$transaction.mockResolvedValue([{ id: '1', order: 2 }]);
      
      const result = await service.reorder('user-1', { categories: [{ id: '1', order: 2 }] });
      expect(result).toEqual([{ id: '1', order: 2 }]);
    });
  });
});
