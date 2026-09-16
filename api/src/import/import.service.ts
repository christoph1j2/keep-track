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

  /**
   * Creates a new import job for a user with the provided initial data. The job is initialized with a status of 'PROCESSING' and is associated with the specified user ID. This method is typically called when a user initiates an import operation, and it sets up the necessary database record to track the progress of the import.
   * 
   * @param userId - The ID of the user for whom the import job is being created. This ID is used to associate the job with the correct user in the database.
   * @param initialData - An array of initial transaction data that will be processed as part of the import job.
   * @returns - A promise that resolves to the newly created import job record in the database. 
   */
  async createImportJob(userId: string, initialData: any[]) {
    return this.prisma.importJob.create({
      data: {
        userId,
        status: 'PROCESSING',
        data: initialData,
      },
    });
  }

  /**
   * Processes an import job in the background, handling deduplication, currency conversion, and categorization of transactions.
   * 
   * @param jobId - The ID of the import job to be processed. This ID is used to retrieve the job from the database and update its status as processing progresses.
   * @param userId - The ID of the user for whom the import job is being processed. 
   * @param incomingTransactions - An array of transactions that have been imported and need processing. 
   * @param useAi - Bool flag indicating whether to use AI for categorization. If false, only heuristic matching will be applied. 
   */
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
      
      // Determine the base currency for the user, defaulting to 'CZK' if not specified. This is used for currency conversion of foreign transactions.
      const baseCurrency = user?.baseCurrency || 'CZK';
      // Filter out transactions that are in a foreign currency (i.e., not the user's base currency) for further processing. These transactions will require exchange rate conversion to the base currency.
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

        // Fetch historical exchange rates for each unique date of the foreign transactions. This is done to ensure that each transaction can be accurately converted to the user's base currency using the correct exchange rate for the date of the transaction.
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

        // Iterates over each foreign transaction and applies the appropriate exchange rate to convert the amount to the user's base currency.
        for (const t of foreignTxns) {
          const d = new Date(t.date);
          const dateStr = d.toISOString().split('T')[0];
          const rates = historicalRates.get(dateStr);
          const origCurr = t.originalCurrency;

          // If exchange rates are available for the transaction's date and original currency, convert the amount to the base currency using the exchange rate. 
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
      // Emit a WebSocket event to the user indicating that the import job has finished successfully.
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

      // Emit a WebSocket event to the user indicating that the import job has failed.
      this.eventsGateway.emitToUser(userId, 'import_finished', {
        status: 'error',
        jobId: jobId,
        message: 'An error occurred during processing. Please try again later.',
      });
    }
  }

  /**
   * Retrieves a pending import job for a user, if one exists.
   * 
   * @param userId - The ID of the user for whom to retrieve the pending job.
   * @param jobId - Optional. The ID of a specific job to retrieve.
   * @returns - A promise that resolves to the pending job, or null if no such job exists.
   */
  async getPendingJobForUser(userId: string, jobId?: string) {
    const whereClause: Prisma.ImportJobWhereInput = {
      userId,
      status: 'READY_FOR_REVIEW',
    };
    if (jobId) {
      whereClause.id = jobId;
    }

    // Fetch the most recent import job for the user that matches the criteria (status: READY_FOR_REVIEW). 
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

  /**
   * Deletes an import job for a user.
   * 
   * @param userId - The ID of the user for whom to delete the job.
   * @param jobId - The ID of the job to delete.
   * @returns - A promise that resolves to an object indicating the success of the operation.
   */
  async deleteJob(userId: string, jobId: string) {
    await this.prisma.importJob.deleteMany({
      where: { id: jobId, userId },
    });
    return { success: true };
  }

  /**
   * Filters out duplicate transactions based on a composite key.
   * 
   * @param userId - The ID of the user for whom to filter duplicates. This is used to fetch existing transactions from the database for comparison.
   * @param transactions - An array of transactions to be filtered for duplicates. Each transaction is checked against existing transactions in the database to determine if it is a duplicate.
   * @returns - A promise that resolves to an array of unique transactions, with duplicates removed based on the composite key (date + amount + title). If no transactions are provided, an empty array is returned.
   */
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
