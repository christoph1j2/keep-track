import { Test, TestingModule } from '@nestjs/testing';
import { cleanDatabase } from './db-cleaner';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('@openrouter/sdk', () => ({
  OpenRouter: jest.fn(),
}));

describe('Users (e2e)', () => {
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
    await cleanDatabase(prisma);

    const testUser = { email: 'user@example.com', password: 'Password123!', username: 'user1', baseCurrency: 'CZK' };
    const registerRes = await request(app.getHttpServer()).post('/users').send(testUser);
    userId = registerRes.body.id;

    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: testUser.email, password: testUser.password });
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/users/me (GET) - Get Profile', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.email).toBe('user@example.com');
    expect(response.body.username).toBe('user1');
  });

  it('/users/me (PATCH) - Update Profile', async () => {
    const response = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ username: 'updatedUser', baseCurrency: 'EUR' })
      .expect(200);

    expect(response.body.username).toBe('updatedUser');
    expect(response.body.baseCurrency).toBe('EUR');
  });

  it('/users/me/password (PATCH) - Change Password', async () => {
    const response = await request(app.getHttpServer())
      .patch('/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: 'Password123!',
        newPassword: 'NewPassword123!'
      })
      .expect(200);

    // Verify password was changed
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    const isPasswordChanged = await bcrypt.compare('NewPassword123!', dbUser!.passwordHash);
    expect(isPasswordChanged).toBe(true);
  });

  it('/users/me (DELETE) - Delete Account', async () => {
    await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser).toBeNull();
  });
});
