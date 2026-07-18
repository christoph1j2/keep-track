import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn(),
}));

describe('Template (e2e)', () => {
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
    await prisma.template.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Setup User & Token
    const testUser = { email: 'template@example.com', password: 'Password123!', username: 'tpluser', baseCurrency: 'CZK' };
    const registerRes = await request(app.getHttpServer()).post('/users').send(testUser);
    userId = registerRes.body.id;

    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: testUser.email, password: testUser.password });
    accessToken = loginRes.body.access_token;

    // Create a base category for template
    const cat = await prisma.category.create({
      data: {
        label: 'Coffee',
        colorClass: 'bg-brown-500',
        iconName: 'Coffee',
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

  it('/templates (POST) - Create a template', async () => {
    const createDto = {
      title: 'Morning Coffee',
      amount: 60,
      categoryId: categoryId,
      showInHotbar: true
    };

    const response = await request(app.getHttpServer())
      .post('/templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Morning Coffee');
    expect(response.body.amount).toBe(60);
    expect(response.body.categoryId).toBe(categoryId);
  });

  it('/templates (GET) - Retrieve user templates', async () => {
    await prisma.template.create({
      data: {
        title: 'Lunch',
        amount: 150,
        categoryId: categoryId,
        userId: userId,
        showInHotbar: false
      }
    });

    const response = await request(app.getHttpServer())
      .get('/templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe('Lunch');
    expect(response.body[0].amount).toBe(150);
  });

  it('/templates/:id (PATCH) - Update a template', async () => {
    const tpl = await prisma.template.create({
      data: {
        title: 'Old Title',
        amount: 50,
        categoryId: categoryId,
        userId: userId,
      }
    });

    const response = await request(app.getHttpServer())
      .patch(`/templates/${tpl.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'New Title', amount: 80 })
      .expect(200);

    expect(response.body.title).toBe('New Title');
    expect(response.body.amount).toBe(80);
  });

  it('/templates/:id (DELETE) - Delete a template', async () => {
    const tpl = await prisma.template.create({
      data: {
        title: 'To Delete',
        amount: 100,
        categoryId: categoryId,
        userId: userId,
      }
    });

    await request(app.getHttpServer())
      .delete(`/templates/${tpl.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const checkTpl = await prisma.template.findUnique({ where: { id: tpl.id } });
    expect(checkTpl).toBeNull();
  });
});
