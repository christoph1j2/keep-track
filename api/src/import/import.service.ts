import { Injectable } from '@nestjs/common';
import { CategorisationService } from '../categorisation/categorisation.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { Prisma, Transaction } from '@prisma/client';

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private notificationService: NotificationService,
    private categorizationService: CategorisationService,
    private exchangeRateService: ExchangeRateService,
  ) {}

  // Vytvori uvodni zaznam v DB
  async createImportJob(userId: string, initialData: any[]) {
    return this.prisma.importJob.create({
      data: {
        userId,
        status: 'PROCESSING',
        data: initialData,
      },
    });
  }

  // Toto bezi odpojene na pozadi
  async processJobInBackground(
    jobId: string,
    userId: string,
    incomingTransactions: Transaction[],
    useAi: boolean = true,
  ) {
    try {
      // Deduplication: remove transactions based on a composite key (date + amount + title)
      incomingTransactions = await this.filterDuplicates(
        userId,
        incomingTransactions,
      );

      console.log(
        `[Import ${jobId}] 🚀 Starting background processing for user ${userId} with ${incomingTransactions.length} transactions (useAi: ${useAi})`,
      );
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
      });
      const baseCurrency = user?.baseCurrency || 'CZK';
      const foreignTxns = incomingTransactions.filter(
        (t: Transaction) =>
          t.originalCurrency && t.originalCurrency !== baseCurrency,
      );

      // Checks if there are foreign currency transactions and fetches historical exchange rates if needed
      if (foreignTxns.length > 0) {
        console.log(
          `[Import] 💱 Currency conversion: ${foreignTxns.length} foreign transactions (base: ${baseCurrency})`,
        );
        const uniqueDates = [
          ...new Set(
            foreignTxns.map((t) => {
              const d = new Date(t.date);
              return d.toISOString().split('T')[0];
            }),
          ),
        ];

        const historicalRates = new Map<string, Record<string, number>>();

        await Promise.all(
          uniqueDates.map(async (dateStr) => {
            const rates = await this.exchangeRateService.getHistoricalRates(
              dateStr,
              baseCurrency,
            );
            historicalRates.set(dateStr, rates);
          }),
        );

        for (const t of foreignTxns) {
          const d = new Date(t.date);
          const dateStr = d.toISOString().split('T')[0];
          const rates = historicalRates.get(dateStr);
          const origCurr = t.originalCurrency;

          if (rates && rates[origCurr]) {
            const rate = rates[origCurr];
            const origAmt = t.originalAmount;
            t.amount = origAmt / rate;
            t.exchangeRate = 1 / rate;
          } else {
            console.warn(
              `[Import] Missing exchange rate for ${origCurr} on ${dateStr}. Skipping conversion.`,
            );
            t.amount = t.originalAmount;
            t.exchangeRate = null;
          }
        }
      }

      // Categorization
      const processedData = await this.categorizationService.categorise(
        userId,
        incomingTransactions,
        useAi,
      );

      console.log(
        `[Import ${jobId}] 💾 Saving ${processedData.length} processed transactions to DB (status: READY_FOR_REVIEW)`,
      );
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'READY_FOR_REVIEW',
          data: processedData as unknown as Prisma.InputJsonArray,
        },
      });

      // Persistent DB notification (must be created BEFORE the WS event,
      // because the frontend fetches notifications when it receives the event)
      await this.notificationService.create(
        userId,
        'IMPORT_READY',
        `Import dokončen (${processedData.length} transakcí)`,
        'Transakce byly analyzovány a čekají na vaše schválení.',
        { jobId },
      );

      // WS
      console.log(
        `[Import ${jobId}] 📡 Emitting import_finished (success) via WebSocket`,
      );
      this.eventsGateway.emitToUser(userId, 'import_finished', {
        status: 'success',
        jobId: jobId,
        data: processedData,
      });
      console.log(`[Import ${jobId}] ✅ Import completed successfully`);
    } catch (error) {
      console.error(`[Import ${jobId}] ❌ Error processing job:`, error);
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
        },
      });

      this.eventsGateway.emitToUser(userId, 'import_finished', {
        status: 'error',
        jobId: jobId,
        message: 'An error occurred during processing. Please try again later.',
      });
    }
  }

  // Frontend asks if there is a pending job for the user (after refresh or during polling)
  async getPendingJobForUser(userId: string, jobId?: string) {
    const whereClause: Prisma.ImportJobWhereInput = {
      userId,
      status: 'READY_FOR_REVIEW',
    };
    if (jobId) {
      whereClause.id = jobId;
    }

    const job = await this.prisma.importJob.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!job) return null;

    return {
      jobId: job.id,
      transactions: job.data,
    };
  }

  // Deletes a job (and its data) for a user
  async deleteJob(userId: string, jobId: string) {
    await this.prisma.importJob.deleteMany({
      where: { id: jobId, userId },
    });
    return { success: true };
  }

  async filterDuplicates(
    userId: string,
    transactions: Transaction[],
  ): Promise<Transaction[]> {
    if (!transactions || transactions.length === 0) return [];

    // To avoid loading all transactions into memory for heavy users,
    // we extract the min and max dates from the incoming transactions and
    // only fetch transactions within that range for deduplication.
    const minDate: Date = new Date(
      Math.min(...transactions.map((t) => new Date(t.date).getTime())),
    );
    const maxDate: Date = new Date(
      Math.max(...transactions.map((t) => new Date(t.date).getTime())),
    );
    const existingTransactions: Transaction[] =
      await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: minDate, lte: maxDate },
        },
      });

    // Build a frequency map of composite keys for existing transactions in DB
    const buildKey = (t: Transaction) => {
      const dateStr = new Date(t.date).toISOString().split('T')[0];
      const amount =
        t.originalAmount !== undefined && t.originalAmount !== null
          ? t.originalAmount
          : t.amount;
      const currency = t.originalCurrency || '';
      return `${t.title}|${amount}|${currency}|${dateStr}`;
    };

    const existingCounts = new Map<string, number>();
    for (const t of existingTransactions) {
      const key = buildKey(t);
      existingCounts.set(key, (existingCounts.get(key) || 0) + 1);
    }

    // Filter incoming transactions: if a matching existing key is found in DB (count > 0),
    // decrement the count (consume 1 match) and discard it.
    // If count is 0, keep the transaction.
    const uniqueTransactions = transactions.filter((t) => {
      const key = buildKey(t);
      const count = existingCounts.get(key) || 0;
      if (count > 0) {
        existingCounts.set(key, count - 1);
        return false; // discard
      }
      return true; // keep
    });

    console.log(
      `[Initial Deduplication] Removed ${transactions.length - uniqueTransactions.length} duplicate transactions based on composite key (date + amount + title)`,
    );

    return uniqueTransactions;
  }
}
