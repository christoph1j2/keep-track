import { Injectable } from "@nestjs/common";
import { CategorisationService } from "../categorisation/categorisation.service";
import { EventsGateway } from "../events/events.gateway";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { ExchangeRateService } from "../exchange-rate/exchange-rate.service";

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
    incomingTransactions: any[],
    useAi: boolean = true,
  ) {
    console.log(
      `[Import ${jobId}] 🚀 Starting background processing for user ${userId} with ${incomingTransactions.length} transactions (useAi: ${useAi})`,
    );
    try {
        const user = await this.prisma.user.findUnique({
            where: {id: userId },
            select: {baseCurrency: true},
        });
        const baseCurrency = user?.baseCurrency || 'CZK';
        const foreignTxns = incomingTransactions.filter(
      (t) => t.originalCurrency && t.originalCurrency !== baseCurrency,
    );

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
          t.exchangeRate = null;
        }
      }
    }

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
          data: processedData as any,
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

  // FE se timto zepta, zda na nej po refreshi nebo během pollingu neco ceka
  async getPendingJobForUser(userId: string, jobId?: string) {
    const whereClause: any = {
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

  async deleteJob(userId: string, jobId: string) {
    await this.prisma.importJob.deleteMany({
      where: { id: jobId, userId },
    });
    return { success: true };
  }
}