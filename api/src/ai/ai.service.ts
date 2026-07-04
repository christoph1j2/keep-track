/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenRouter } from '@openrouter/sdk';
import type { Transaction } from '@prisma/client';

export interface ProcessedTransaction {
  id: string;
  date: Date;
  title: string;
  amount: number;
  categoryId: string | null;
  isAiCategorized: boolean;
}

@Injectable()
export class AiService {
  private aiClient: OpenRouter;
  constructor(private prisma: PrismaService) {
    this.aiClient = new OpenRouter({
      apiKey: `${process.env.OPENROUTER_API_KEY}`,
      appTitle: 'KeepTrack',
      httpReferer: process.env.FRONTEND_URL || 'http://localhost:5173',
    });
  }

  async processBatch(
    userId: string,
    incomingTransactions: Transaction[],
  ): Promise<ProcessedTransaction[]> {
    if (incomingTransactions.length === 0) return [];

    // 1. LOCAL HEURISTICS
    const history = await this.prisma.transaction.findMany({
      where: { userId },
      select: { title: true, categoryId: true },
      distinct: ['title', 'categoryId'],
    });

    const userCategories = await this.prisma.category.findMany({
      where: { userId, type: 'EXPENSE' },
      select: { id: true, label: true },
    });

    if (userCategories.length === 0) {
      return incomingTransactions.map((t) => ({
        ...t,
        categoryId: null,
        isAiCategorized: false,
      }));
    }

    const results: ProcessedTransaction[] = [];
    const unmappedForAi: Transaction[] = [];

    for (const incoming of incomingTransactions) {
      const lowerTitle = incoming.title.toLowerCase().trim();
      const match = history.find((h) => {
        const pastTitle = h.title.toLowerCase().trim();
        return lowerTitle.includes(pastTitle) || pastTitle.includes(lowerTitle);
      });

      if (match && userCategories.some((c) => c.id === match.categoryId)) {
        results.push({
          ...incoming,
          categoryId: match.categoryId,
          isAiCategorized: false,
        });
      } else {
        unmappedForAi.push(incoming);
      }
    }

    // 2. AI CATEGORIZATION (Optimized with Deduplication and Chunking)
    if (unmappedForAi.length > 0) {
      const keyInfo = await this.aiClient.apiKeys.getCurrentKeyMetadata();
      console.log(keyInfo.data);

      // Step A: Deduplicate by title to save tokens and time
      const uniqueTitles = [...new Set(unmappedForAi.map((t) => t.title))];
      const aiTitleToCategoryMap = new Map<string, string | null>();

      const categoryContext = userCategories
        .map((c) => `- ID: "${c.id}", Label: "${c.label}"`)
        .join('\n');

      const systemPrompt = `
        You are an expert financial assistant specializing in the Czech Republic and European markets. 
        Your task is to categorize bank transactions based on their merchant names.

        Available user categories (use ONLY these IDs):
        ${categoryContext}

        Context & Cheat Sheet for common (Czech/European) merchants:
        - Groceries/Supermarkets: Tesco, Kaufland, Albert, Lidl, Penny, Billa, Globus, Makro, Coop. ...
        - Public Transport/Trains: ČD (České dráhy), PMDP (Plzeňské městské dopravní podniky), RegioJet, FlixBus, Leo Express, IDS. ...
        - Drugstores/Cosmetics: dm drogerie, Teta, Rossmann, Notino. ...
        - Food/Restaurants: Wolt, Foodora, Bolt Food, McDonald's, KFC, Burger King. ...
        - Tech/Hobby: Alza, CZC, Datart, Hornbach, OBI, Bauhaus. ...
        - Utilities/Services: E.ON, ČEZ, Pražská plynárenská, Vodafone, O2, T-Mobile. ...
        - Entertainment/Streaming: Netflix, Spotify, HBO Max, Disney+, Apple TV+. ...
        - Salary: Vyplata, Payroll, Salary, mzda, výplata. ...

        Rules:
        1. Return ONLY clean valid JSON in the format of an array of objects: [{"title": "exact_transaction_title", "categoryId": "category_id"}]
        2. If *ABSOLUTELY* unsure, set "categoryId": null.
        3. Ignore corporate filler words like "a.s.", "s.r.o.", "z.s.", city names, or phrases like "platba kartou". Focus on the core merchant name to make your decision.
        4. CRITICAL: Output absolutely nothing but the JSON array. Do not include markdown backticks or explanations.
      `;

      // Step B: Process in chunks of 40 to avoid free-tier token limits/timeouts
      // Quick and dirty sleep helper
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      const CHUNK_SIZE = 40;

      for (let i = 0; i < uniqueTitles.length; i += CHUNK_SIZE) {
        const titleChunk = uniqueTitles.slice(i, i + CHUNK_SIZE);
        console.log(
          `Processing AI chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(uniqueTitles.length / CHUNK_SIZE)}`,
        );

        let retries = 3; // Give it 3 chances to succeed
        let currentSleep = 10000; // Start with 10 seconds for the first retry

        while (retries > 0) {
          try {
            const aiResponse = await this.aiClient.chat.send({
              chatRequest: {
                model: 'openrouter/free',
                responseFormat: { type: 'json_object' },
                messages: [
                  { role: 'system', content: systemPrompt },
                  {
                    role: 'user',
                    content: JSON.stringify(
                      titleChunk.map((title) => ({ title })),
                    ),
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
              for (const item of parsedData) {
                if (item.title) {
                  aiTitleToCategoryMap.set(item.title, item.categoryId || null);
                }
              }
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
        if (i + CHUNK_SIZE < uniqueTitles.length) {
          await sleep(5000); // 5 seconds
        }
      }

      // Step D: Apply the deduplicated AI mappings back to the actual transactions
      for (const incoming of unmappedForAi) {
        const mappedCategoryId = aiTitleToCategoryMap.get(incoming.title);
        results.push({
          ...incoming,
          categoryId: mappedCategoryId || null,
          isAiCategorized: !!mappedCategoryId,
        });
      }
    }

    // 3. RETURN RESULTS maintaining original order
    return incomingTransactions.map(
      (inc) =>
        results.find((r) => r.id === inc.id) || {
          ...inc,
          categoryId: null,
          isAiCategorized: false,
        },
    );
  }
}
