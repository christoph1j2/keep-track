import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionModule, TransactionService], // Exportujeme modul a službu, aby byly dostupné v AiModule
})
export class TransactionModule {}
