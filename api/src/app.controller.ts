import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  type AppInfo,
  AppService,
  type HealthCheckResult,
} from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application info and status' })
  @ApiResponse({ status: 200, description: 'Application metadata' })
  getInfo(): AppInfo {
    return this.appService.getInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Check API and service health status' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy / database down',
  })
  async getHealth(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthCheckResult> {
    const health = await this.appService.getHealth();
    if (health.status !== 'ok') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }
}
