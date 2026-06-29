import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  controllers: [AiController],
  providers: [AiService],
  imports: [TransactionModule],
})
export class AiModule {}
