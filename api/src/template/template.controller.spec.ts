import { Test, TestingModule } from '@nestjs/testing';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';

describe('TemplateController', () => {
  let controller: TemplateController;
  let service: TemplateService;

  const mockTemplateService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    reorder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [
        { provide: TemplateService, useValue: mockTemplateService },
      ],
    }).compile();

    controller = module.get<TemplateController>(TemplateController);
    service = module.get<TemplateService>(TemplateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', () => {
      const dto = { title: 'Test', amount: -45, categoryId: '1', showInHotbar: false } as CreateTemplateDto;
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

  describe('reorder', () => {
    it('should call service.reorder', async () => {
      const dto = { templates: [{ id: '1', order: 1 }] };
      const req = { user: { id: 'user-1' } } as any;
      await controller.reorder(dto, req);
      expect(service.reorder).toHaveBeenCalledWith('user-1', dto);
    });
  });
});
