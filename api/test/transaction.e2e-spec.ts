import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn(),
}));

describe('Transaction (e2e)', () => {
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
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Setup User & Token
    const testUser = { email: 'transaction@example.com', password: 'Password123!', username: 'txuser', baseCurrency: 'CZK' };
    const registerRes = await request(app.getHttpServer()).post('/users').send(testUser);
    userId = registerRes.body.id;

    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: testUser.email, password: testUser.password });
    accessToken = loginRes.body.access_token;

    // Create a base category for transaction
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

  it('/transactions (POST) - Create a transaction', async () => {
    const createDto = {
      title: 'Groceries',
      amount: 1500,
      originalAmount: 1500,
      originalCurrency: 'CZK',
      date: new Date().toISOString(),
      categoryId: categoryId,
      isAiCategorized: false
    };

    const response = await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.amount).toBe(1500);
    expect(response.body.categoryId).toBe(categoryId);
  });

  it('/transactions (GET) - Retrieve user transactions', async () => {
    await prisma.transaction.create({
      data: {
        title: 'Rent',
        amount: 15000,
        date: new Date(),
        categoryId: categoryId,
        userId: userId,
        originalAmount: 15000,
        originalCurrency: 'CZK'
      }
    });

    const response = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].amount).toBe(15000);
  });

  it('/transactions/:id (DELETE) - Delete a transaction', async () => {
    const tx = await prisma.transaction.create({
      data: {
        title: 'To Delete',
        amount: 100,
        date: new Date(),
        categoryId: categoryId,
        userId: userId,
        originalAmount: 100,
        originalCurrency: 'CZK'
      }
    });

    await request(app.getHttpServer())
      .delete(`/transactions/${tx.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Verify it's gone
    const checkTx = await prisma.transaction.findUnique({ where: { id: tx.id } });
    expect(checkTx).toBeNull();
  });
});
