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

describe('Category (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

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
    // Clean tables
    await cleanDatabase(prisma);

    // Create user and get token
    const testUser = {
      email: 'categorytest@example.com',
      password: 'Password123!',
      username: 'cattest',
      baseCurrency: 'CZK'
    };

    const registerRes = await request(app.getHttpServer())
      .post('/users')
      .send(testUser);
      
    userId = registerRes.body.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/categories (POST) - Create a new category', async () => {
    const createDto = {
      label: 'Groceries',
      colorClass: 'bg-green-500',
      iconName: 'ShoppingCart',
      type: 'EXPENSE'
    };

    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.label).toBe(createDto.label);
    expect(response.body.userId).toBe(userId);
  });

  it('/categories (GET) - Retrieve user categories', async () => {
    // Create a category directly in DB first
    await prisma.category.create({
      data: {
        label: 'Salary',
        colorClass: 'bg-blue-500',
        iconName: 'Banknote',
        type: 'INCOME',
        userId: userId,
      }
    });

    const response = await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].label).toBe('Salary');
  });

  it('/categories/:id (PATCH) - Update a category', async () => {
    // Create a category
    const cat = await prisma.category.create({
      data: {
        label: 'Old Label',
        colorClass: 'bg-red-500',
        iconName: 'Icon',
        type: 'EXPENSE',
        userId: userId,
      }
    });

    const updateDto = { label: 'New Label' };

    const response = await request(app.getHttpServer())
      .patch(`/categories/${cat.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateDto)
      .expect(200);

    expect(response.body.label).toBe('New Label');
  });

  it('/categories/:id (DELETE) - Delete a category', async () => {
    const cat = await prisma.category.create({
      data: {
        label: 'To Delete',
        colorClass: 'bg-red-500',
        iconName: 'Icon',
        type: 'EXPENSE',
        userId: userId,
      }
    });

    await request(app.getHttpServer())
      .delete(`/categories/${cat.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Verify it's gone
    const checkCat = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(checkCat).toBeNull();
  });
});
