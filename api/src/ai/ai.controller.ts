import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Chytrá kategorizace (background task)' })
  categorizeBatch(
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

    this.aiService
      .processBatchAndNotify(req.user.id, incomingTransactions)
      .catch((error) => console.error('Error processing batch:', error));

    return { message: 'Batch processing started' };
  }

    @Post('import/start')
  @HttpCode(HttpStatus.ACCEPTED)
  async startImport(@Req() req, @Body('transactions') transactions: any[]) {
    // controller vytvori job a odpovi fe
    const job = await this.aiService.createImportJob(req.user.id, transactions);

    // zde spoustime bg proces
    this.aiService.processJobInBackground(job.id, req.user.id, transactions)
    .catch(err => console.error(`Job ${job.id} failed:`, err));

    return { message: 'Import job started', jobId: job.id };
  }

  @Get('import/pending')
  async getPendingJob(@Req() req) {
    return this.aiService.getPendingJobForUser(req.user.id);
  }

  @Delete('import/:jobId')
  async deleteJob(@Req() req, @Param('jobId') jobId: string) {
    return this.aiService.deleteJob(req.user.id, jobId);
  }
}
