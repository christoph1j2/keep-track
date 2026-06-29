import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { CategorizeBatchDto } from './dto/categorize-batch.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { TransactionService } from '../transaction/transaction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post('categorize-batch')
  @ApiOperation({ summary: 'Chytrá kategorizace' })
  async categorizeBatch(
    @Req() req: AuthenticatedRequest,
    @Body() categorizeBatchDto: CategorizeBatchDto,
  ) {
    const incomingTransactions = categorizeBatchDto.transactions.map((t) => ({
      id: t.id,
      title: t.title,
      date: new Date(t.date),
      amount: t.amount,
      originalAmount: t.originalAmount,
      originalCurrency: t.originalCurrency,
      userId: req.user.id,
      categoryId: null,
      isAiCategorized: false,
      bankReferenceId: null, // Bank ID doesn't exist yet for CSV imports
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    return await this.aiService.processBatch(req.user.id, incomingTransactions);
  }
}
