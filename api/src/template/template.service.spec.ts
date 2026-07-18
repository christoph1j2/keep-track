import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';

describe('TemplateService', () => {
  let service: TemplateService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    template: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a template', async () => {
      const dto = { title: 'Test', amount: -45, categoryId: '1', showInHotbar: false } as CreateTemplateDto;
      mockPrismaService.template.create.mockResolvedValue({ id: '1', ...dto, userId: 'user-1' });

      const result = await service.create('user-1', dto);
      expect(result.id).toBe('1');
    });
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      mockPrismaService.template.findMany.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAll('user-1');
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('findOne', () => {
    it('should return a template', async () => {
      mockPrismaService.template.findFirst.mockResolvedValue({ id: '1' });
      const result = await service.findOne('user-1', '1');
      expect(result).toEqual({ id: '1' });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.template.findFirst.mockResolvedValue(null);
      await expect(service.findOne('user-1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1' } as any);
      mockPrismaService.template.update.mockResolvedValue({ id: '1', amount: 200 });

      const result = await service.update('user-1', '1', { amount: 200 });
      expect(result.amount).toBe(200);
    });
  });

  describe('remove', () => {
    it('should remove a template', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1' } as any);
      mockPrismaService.template.delete.mockResolvedValue({ id: '1' });

      const result = await service.remove('user-1', '1');
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('reorder', () => {
    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.template.findMany.mockResolvedValue([]);
      await expect(service.reorder('user-1', { templates: [{ id: '1', order: 1 }] })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if template belongs to another user', async () => {
      mockPrismaService.template.findMany.mockResolvedValue([{ id: '1', userId: 'other-user' }]);
      await expect(service.reorder('user-1', { templates: [{ id: '1', order: 1 }] })).rejects.toThrow(ForbiddenException);
    });

    it('should reorder templates', async () => {
      mockPrismaService.template.findMany.mockResolvedValue([{ id: '1', userId: 'user-1', order: 1 }]);
      mockPrismaService.$transaction.mockResolvedValue([{ id: '1', order: 2 }]);

      const result = await service.reorder('user-1', { templates: [{ id: '1', order: 2 }] });
      expect(result).toEqual([{ id: '1', order: 2 }]);
    });
  });
});
