import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppService', () => {
  let service: AppService;
  let prismaService: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInfo', () => {
    it('should return application metadata', () => {
      const info = service.getInfo();
      expect(info).toMatchObject({
        name: 'Keep Track API',
        status: 'online',
        docs: '/api/docs',
      });
      expect(typeof info.version).toBe('string');
      expect(typeof info.timestamp).toBe('string');
    });
  });

  describe('getHealth', () => {
    it('should return healthy status when database is reachable', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const health = await service.getHealth();

      expect(health.status).toBe('ok');
      expect(health.services.database.status).toBe('up');
      expect(typeof health.services.database.latencyMs).toBe('number');
      expect(health.services.database.error).toBeUndefined();
      expect(typeof health.uptime).toBe('number');
      expect(health.memory).toHaveProperty('heapUsedMb');
      expect(health.memory).toHaveProperty('heapTotalMb');
      expect(health.memory).toHaveProperty('rssMb');
    });

    it('should return error status when database fails', async () => {
      prismaService.$queryRaw.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const health = await service.getHealth();

      expect(health.status).toBe('error');
      expect(health.services.database.status).toBe('down');
      expect(health.services.database.error).toBe('Database connection failed');
      expect(health.services.database.latencyMs).toBeUndefined();
    });
  });
});
