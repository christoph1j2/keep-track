import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    title: "Mocked Category",
                    categoryId: "mocked-cat-id",
                    categoryLabel: "Food",
                    categoryColorClass: "bg-red-500",
                    categoryIconName: "Food",
                    categoryType: "EXPENSE",
                    amount: 50,
                    date: "2026-06-22T10:00:00.000Z",
                    originalAmount: 50,
                    originalCurrency: "CZK",
                    bankReferenceId: null
                  }
                ])
              }
            }
          ]
        })
      }
    }
  }))
}));

describe('AI (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5433/keep-track-test?schema=public';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    const { execSync } = require('child_process');
    execSync('npx prisma db push --accept-data-loss', { env: { ...process.env } });
  });

  beforeEach(async () => {
    await prisma.importJob.deleteMany();
    await prisma.user.deleteMany();

    const testUser = { email: 'ai@example.com', password: 'Password123!', username: 'aiuser', baseCurrency: 'CZK' };
    await request(app.getHttpServer()).post('/users').send(testUser);

    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: testUser.email, password: testUser.password });
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/ai/import/start (POST) - Starts import job', async () => {
    const transactions = [
      { date: '2026-06-22', title: 'Tesco', amount: -50 }
    ];

    const response = await request(app.getHttpServer())
      .post('/ai/import/start')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ transactions })
      .expect(202);

    expect(response.body).toHaveProperty('jobId');
    expect(response.body.message).toBe('Import job started');
  });

  it('/ai/import/pending (GET) - Retrieves pending job', async () => {
    // create job manually in DB that is READY_FOR_REVIEW
    const job = await prisma.importJob.create({
      data: {
        userId: accessToken ? (await prisma.user.findFirst({ where: { email: 'ai@example.com' } }))!.id : '',
        status: 'READY_FOR_REVIEW',
        data: [{ date: '2026-06-22', title: 'Tesco', amount: -50 }]
      }
    });

    const response = await request(app.getHttpServer())
      .get('/ai/import/pending')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.jobId).toBe(job.id);
    expect(Array.isArray(response.body.transactions)).toBe(true);
  });
});
