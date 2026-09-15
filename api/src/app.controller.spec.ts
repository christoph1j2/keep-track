import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AppController } from './app.controller';
import { AppInfo, AppService, HealthCheckResult } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: jest.Mocked<Partial<AppService>>;

  beforeEach(async () => {
    appService = {
      getInfo: jest.fn(),
      getHealth: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getInfo', () => {
    it('should return app info from AppService', () => {
      const mockInfo: AppInfo = {
        name: 'Keep Track API',
        version: '1.0.0',
        status: 'online',
        docs: '/api/docs',
        timestamp: '2026-09-15T15:00:00.000Z',
      };
      (appService.getInfo as jest.Mock).mockReturnValue(mockInfo);

      expect(appController.getInfo()).toEqual(mockInfo);
      expect(appService.getInfo).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealth', () => {
    it('should return healthy status without modifying response status code', async () => {
      const mockHealth: HealthCheckResult = {
        status: 'ok',
        timestamp: '2026-09-15T15:00:00.000Z',
        uptime: 120,
        environment: 'test',
        services: {
          database: {
            status: 'up',
            latencyMs: 3,
          },
        },
        memory: {
          heapUsedMb: 50,
          heapTotalMb: 100,
          rssMb: 120,
        },
      };
      (appService.getHealth as jest.Mock).mockResolvedValue(mockHealth);

      const statusMock = jest.fn();
      const mockRes = {
        status: statusMock,
      } as unknown as Response;

      const result = await appController.getHealth(mockRes);

      expect(result).toEqual(mockHealth);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should set status 503 when service health is error', async () => {
      const mockHealth: HealthCheckResult = {
        status: 'error',
        timestamp: '2026-09-15T15:00:00.000Z',
        uptime: 120,
        environment: 'test',
        services: {
          database: {
            status: 'down',
            error: 'Connection timeout',
          },
        },
        memory: {
          heapUsedMb: 50,
          heapTotalMb: 100,
          rssMb: 120,
        },
      };
      (appService.getHealth as jest.Mock).mockResolvedValue(mockHealth);

      const statusMock = jest.fn();
      const mockRes = {
        status: statusMock,
      } as unknown as Response;

      const result = await appController.getHealth(mockRes);

      expect(result).toEqual(mockHealth);
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });
});
