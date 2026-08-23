import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImportService } from './import.service';
import { Transaction } from '@prisma/client/index-browser';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  async startImport(
    @Req() req: AuthenticatedRequest,
    @Body('transactions') transactions: Transaction[],
    @Body('useAi') useAi?: boolean,
  ) {
    if (!Array.isArray(transactions)) {
      throw new BadRequestException('`transactions` must be an array.');
    }
    if (transactions.some((t) => typeof t !== 'object' || t === null)) {
      throw new BadRequestException(
        '`transactions` must contain only objects.',
      );
    }

    const safeTransactions = transactions;
    const shouldUseAi = useAi ?? true;

    // controller vytvori job a odpovi fe
    const job = await this.importService.createImportJob(
      req.user.id,
      safeTransactions,
    );
    // zde spoustime bg proces
    this.importService
      .processJobInBackground(
        job.id,
        req.user.id,
        safeTransactions,
        shouldUseAi,
      )
      .catch((err) => console.error(`Job ${job.id} failed:`, err));

    return { message: 'Import job started', jobId: job.id };
  }

  @Get('pending')
  async getPendingJob(
    @Req() req: AuthenticatedRequest,
    @Query('jobId') jobId?: string,
  ) {
    return this.importService.getPendingJobForUser(req.user.id, jobId);
  }

  @Delete(':jobId')
  async deleteJob(
    @Req() req: AuthenticatedRequest,
    @Param('jobId') jobId: string,
  ) {
    return this.importService.deleteJob(req.user.id, jobId);
  }
}
