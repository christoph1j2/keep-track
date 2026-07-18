import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  const mockCategoryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    reorder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', () => {
      const dto: CreateCategoryDto = { label: 'Test', colorClass: 'bg', iconName: 'icon', type: 'EXPENSE' };
      const req = { user: { id: 'user-1' } } as any;
      controller.create(dto, req);
      expect(service.create).toHaveBeenCalledWith('user-1', dto);
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
      const dto = { label: 'Updated' };
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

  describe('reorder', () => {
    it('should call service.reorder', async () => {
      const dto = { categories: [{ id: '1', order: 1 }] };
      const req = { user: { id: 'user-1' } } as any;
      await controller.reorder(dto, req);
      expect(service.reorder).toHaveBeenCalledWith('user-1', dto);
    });
  });
});
