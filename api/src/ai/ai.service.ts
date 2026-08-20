/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenRouter } from '@openrouter/sdk';
import type { Transaction } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notification/notification.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { normaliseTitle } from '../categorisation/helpers/title-normaliser';



@Injectable()
export class AiService {
  private aiClient: OpenRouter;
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private notificationService: NotificationService,
    private exchangeRateService: ExchangeRateService,
  ) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    this.aiClient = new OpenRouter({
      apiKey,
      appTitle: 'KeepTrack',
      httpReferer: process.env.FRONTEND_URL || 'http://localhost:5173',
    });
  }

  async processBatchAndNotify(
    userId: string,
    incomingTransactions: Transaction[],
  ) {
    try {
      const results = await this.processBatch(userId, incomingTransactions);

      this.eventsGateway.emitToUser(userId, 'import_finished', {
        status: 'success',
        data: results,
      });
    } catch (error) {
      console.error('Critical error in the AI pipeline:', error);
      this.eventsGateway.emitToUser(userId, 'import_finished', {
        status: 'error',
        message:
          'An error occurred during AI processing. Please try again later.',
      });
    }
  }

  async processBatch(
    userId: string,
    incomingTransactions: Transaction[],
  ): Promise<ProcessedTransaction[]> {
    if (incomingTransactions.length === 0) return [];
    console.log(
      `[Import] 📊 processBatch started: ${incomingTransactions.length} transactions for user ${userId}`,
    );
    // 0. CURRENCY CONVERSION (Historical Rates)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
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

    // 2. AI CATEGORIZATION (Optimized with Deduplication and Chunking)
    console.log(
      `[Import] 🔍 Local heuristics: ${results.length} matched locally, ${unmappedForAi.length} sent to AI (${userCategories.length} user categories available)`,
    );
    if (unmappedForAi.length > 0 && process.env.OPENROUTER_API_KEY) {
      //const keyInfo = await this.aiClient.apiKeys.getCurrentKeyMetadata();
      //console.log(keyInfo.data);

      // Step A: Deduplicate by title to save tokens and time
      const titleToNormalizedMap = new Map<string, string>();
      const normalizedToCategoryMap = new Map<string, string | null>();

      for (const t of unmappedForAi) {
        const normalized = normaliseTitle(t.title);
        titleToNormalizedMap.set(t.title, normalized);
      }

      const uniqueNormalizedTitles = [
        ...new Set(titleToNormalizedMap.values()),
      ];
      console.log(
        `[Import] 🧹 Deduplication: ${unmappedForAi.length} transactions → ${uniqueNormalizedTitles.length} unique titles (${Math.ceil(uniqueNormalizedTitles.length / 80)} AI chunks needed)`,
      );

      // Step B: Process in chunks of 80 to avoid free-tier token limits/timeouts
      // Quick and dirty sleep helper
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      const CHUNK_SIZE = 80;

      for (let i = 0; i < uniqueNormalizedTitles.length; i += CHUNK_SIZE) {
        const titleChunk = uniqueNormalizedTitles.slice(i, i + CHUNK_SIZE);
        console.log(
          `Processing AI chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(uniqueNormalizedTitles.length / CHUNK_SIZE)}`,
        );

        let retries = 3; // Give it 3 chances to succeed
        let currentSleep = 10000; // Start with 10 seconds for the first retry

        while (retries > 0) {
          try {
            const aiResponse = await this.aiClient.chat.send({
              chatRequest: {
                model: 'google/gemma-4-26b-a4b-it:free',
                responseFormat: { type: 'json_object' },
                messages: [
                  { role: 'system', content: systemPrompt },
                  {
                    role: 'user',
                    content: JSON.stringify({
                      transactions: titleChunk.map((title) => ({ title })),
                    }),
                  },
                ],
                stream: false,
              },
            });

            // Step C: Null safety check
            const content = aiResponse?.choices?.[0]?.message?.content;
            if (!content) {
              console.warn(
                `AI returned empty response for chunk ${i}. Skipping chunk.`,
              );
              break; // Break the retry loop and move to the next chunk
            }

            const cleanJson = content.replace(/```(json)?/gi, '').trim();
            let parsedData = JSON.parse(cleanJson);

            if (
              !Array.isArray(parsedData) &&
              typeof parsedData === 'object' &&
              parsedData !== null
            ) {
              const extractedArray = Object.values(parsedData).find((val) =>
                Array.isArray(val),
              );
              parsedData = extractedArray || [];
            }

            if (Array.isArray(parsedData)) {
              let chunkCategorized = 0;
              for (const item of parsedData) {
                if (item.title) {
                  normalizedToCategoryMap.set(
                    item.title,
                    item.categoryId || null,
                  );
                  if (item.categoryId) chunkCategorized++;
                }
              }
              console.log(
                `[Import] 🤖 AI chunk ${i / CHUNK_SIZE + 1}: ${chunkCategorized}/${parsedData.length} titles categorized`,
              );
            }

            break; // Success! Break the retry loop and move to the next chunk
          } catch (error: any) {
            // Check if it's a rate limit error
            if (error.statusCode === 429) {
              console.warn(
                `Rate limit hit on chunk ${i}. Waiting ${currentSleep / 1000} seconds before retrying... (${retries} retries left)`,
              );
              await sleep(currentSleep);

              currentSleep *= 2; // Double the wait time for the next retry
              retries--;
            } else {
              console.error(
                `Unexpected error processing AI chunk starting at index ${i}:`,
                error,
              );
              break; // If it's a different error, stop retrying this chunk
            }
          }
        }

        // Add a standard 5-second buffer between successful chunks just to be polite to the API
        if (i + CHUNK_SIZE < uniqueNormalizedTitles.length) {
          await sleep(5000); // 5 seconds
        }
      }

      // Step D: Apply the deduplicated AI mappings back to the actual transactions
      for (const incoming of unmappedForAi) {
        const normalized = titleToNormalizedMap.get(incoming.title);
        const mappedCategoryId = normalizedToCategoryMap.get(
          normalized || incoming.title,
        );
        results.push({
          ...incoming,
          categoryId: mappedCategoryId || null,
          isAiCategorized: !!mappedCategoryId,
        });
      }
    }

    // 3. RETURN RESULTS maintaining original order
    const aiCategorized = results.filter((r) => r.isAiCategorized).length;
    const localMatched = results.filter(
      (r) => r.categoryId && !r.isAiCategorized,
    ).length;
    const uncategorized = results.filter((r) => !r.categoryId).length;
    console.log(
      `[Import] 📋 Final results: ${localMatched} local matches, ${aiCategorized} AI categorized, ${uncategorized} uncategorized (${results.length} total)`,
    );
    return incomingTransactions.map(
      (inc) =>
        results.find((r) => r.id === inc.id) || {
          ...inc,
          categoryId: null,
          isAiCategorized: false,
        },
    );
  }

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
  ) {
    console.log(
      `[Import ${jobId}] 🚀 Starting background processing for user ${userId} with ${incomingTransactions.length} transactions`,
    );
    try {
      const processedData = await this.processBatch(
        userId,
        incomingTransactions,
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
