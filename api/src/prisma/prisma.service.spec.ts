import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    // We need to mock process.env.DATABASE_URL to avoid errors
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/mydb?schema=public';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
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
