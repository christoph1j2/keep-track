import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TransactionModule } from '../transaction/transaction.module';
import { NotificationsModule } from '../notification/notifications.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [AiController],
  providers: [AiService],
  imports: [TransactionModule, NotificationsModule, NotificationModule],
})
export class AiModule {}

