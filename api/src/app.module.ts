import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CategoryModule } from './category/category.module';
import { TransactionModule } from './transaction/transaction.module';
import { BudgetModule } from './budget/budget.module';
import { TemplateModule } from './template/template.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_PASSWORD,
        },
      },
      defaults: {
        from: '"Keep Track" <keep-track@ecl-it.cz>',
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    CategoryModule,
    TransactionModule,
    BudgetModule,
    TemplateModule,
    AiModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
