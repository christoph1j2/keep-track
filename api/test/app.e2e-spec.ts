import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppInfo, HealthCheckResult } from '../src/app.service';

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn(),
}));

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      'postgresql://postgres:password@127.0.0.1:5433/keep-track-test?schema=public';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) returns application metadata', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    const body = res.body as AppInfo;

    expect(body).toMatchObject({
      name: 'Keep Track API',
      status: 'online',
      docs: '/api/docs',
    });
    expect(typeof body.version).toBe('string');
    expect(typeof body.timestamp).toBe('string');
  });

  it('/health (GET) returns health check status', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    const body = res.body as HealthCheckResult;

    expect([200, 503]).toContain(res.status);
    expect(['ok', 'error']).toContain(body.status);
    expect(body).toHaveProperty('services');
    expect(body.services).toHaveProperty('database');
    expect(body).toHaveProperty('memory');
    expect(typeof body.uptime).toBe('number');
  });

  afterEach(async () => {
    await app.close();
  });
});
