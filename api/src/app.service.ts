import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

export interface AppInfo {
  name: string;
  version: string;
  status: string;
  docs: string;
  timestamp: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    database: {
      status: 'up' | 'down';
      latencyMs?: number;
      error?: string;
    };
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
}

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getInfo(): AppInfo {
    return {
      name: 'Keep Track API',
      version: process.env.npm_package_version || '1.0.0',
      status: 'online',
      docs: '/api/docs',
      timestamp: new Date().toISOString(),
    };
  }

  async getHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let dbStatus: 'up' | 'down' = 'up';
    let latencyMs: number | undefined;
    let dbError: string | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - startTime;
    } catch (error) {
      dbStatus = 'down';
      dbError =
        error instanceof Error ? error.message : 'Unknown database error';
    }

    const memory = process.memoryUsage();
    const toMb = (bytes: number) =>
      Math.round((bytes / 1024 / 1024) * 100) / 100;

    return {
      status: dbStatus === 'up' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          ...(latencyMs !== undefined ? { latencyMs } : {}),
          ...(dbError ? { error: dbError } : {}),
        },
      },
      memory: {
        heapUsedMb: toMb(memory.heapUsed),
        heapTotalMb: toMb(memory.heapTotal),
        rssMb: toMb(memory.rss),
      },
    };
  }
}
