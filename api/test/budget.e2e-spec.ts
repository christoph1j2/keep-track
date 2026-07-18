import { Test, TestingModule } from '@nestjs/testing';
import { cleanDatabase } from './db-cleaner';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn(),
}));

describe('Budget (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let categoryId: string;

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
    await cleanDatabase(prisma);

    // Setup User & Token
    const testUser = { email: 'budget@example.com', password: 'Password123!', username: 'budgetuser', baseCurrency: 'CZK' };
    const registerRes = await request(app.getHttpServer()).post('/users').send(testUser);
    userId = registerRes.body.id;

    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: testUser.email, password: testUser.password });
    accessToken = loginRes.body.access_token;

    // Create a base category for budget
    const cat = await prisma.category.create({
      data: {
        label: 'Food',
        colorClass: 'bg-red-500',
        iconName: 'Food',
        type: 'EXPENSE',
        userId: userId,
      }
    });
    categoryId = cat.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/budgets (POST) - Create a budget', async () => {
    const createDto = {
      limit: 5000,
      categoryId: categoryId
    };

    const response = await request(app.getHttpServer())
      .post('/budgets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.limit).toBe(5000);
    expect(response.body.categoryId).toBe(categoryId);
  });

  it('/budgets (GET) - Retrieve user budgets', async () => {
    await prisma.budget.create({
      data: {
        limit: 3000,
        categoryId: categoryId,
        userId: userId,
      }
    });

    const response = await request(app.getHttpServer())
      .get('/budgets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].limit).toBe(3000);
  });
});
