import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn(),
}));

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    // override DB URL for testing
    process.env.DATABASE_URL = 'postgresql://postgres:password@127.0.0.1:5433/keep-track-test?schema=public';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Add validation pipe just like main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // push db schema to the test db before tests
    const { execSync } = require('child_process');
    execSync('npx prisma db push --accept-data-loss', { env: { ...process.env } });
  });

  beforeEach(async () => {
    // clean db before each test
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    username: 'testuser',
    baseCurrency: 'CZK'
  };

  it('/users (POST) - Register', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(testUser.email);
    expect(response.body).not.toHaveProperty('password');
  });

  it('/auth/login (POST)', async () => {
    // Register first
    await request(app.getHttpServer()).post('/users').send(testUser);

    // Then login
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
    expect(response.body.user.email).toBe(testUser.email);
  });

  it('/auth/forgot-password (POST)', async () => {
    await request(app.getHttpServer()).post('/users').send(testUser);

    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: testUser.email })
      .expect(200);

    expect(response.body.message).toBe('Password reset email sent if the email exists');

    const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
    expect(dbUser?.resetPasswordToken).not.toBeNull();
  });

  it('/auth/reset-password/:token (PATCH)', async () => {
    await request(app.getHttpServer()).post('/users').send(testUser).expect(201);
    
    const token = 'test-reset-token-123';
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await prisma.user.update({
      where: { email: testUser.email },
      data: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: expires
      }
    });

    const response = await request(app.getHttpServer())
      .patch(`/auth/reset-password/${token}`)
      .send({ newPassword: 'BrandNewPassword123!', confirmPassword: 'BrandNewPassword123!' });
      
    if (response.status !== 200) {
      console.log('Reset Password Error:', response.body);
    }
    
    expect(response.status).toBe(200);

    expect(response.body.message).toBe('Password has been reset successfully');
  });
});
