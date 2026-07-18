import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let originalDbUrl: string | undefined;

  beforeEach(async () => {
    // We need to mock process.env.DATABASE_URL to avoid errors
    originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/mydb?schema=public';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    if (originalDbUrl !== undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDbUrl;
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call $connect', async () => {
      service.$connect = jest.fn().mockResolvedValue(true);
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalled();
    });
  });
});
