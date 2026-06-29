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
      // Step A: Deduplicate by title to save tokens and time
      const uniqueTitles = [...new Set(unmappedForAi.map((t) => t.title))];
      const aiTitleToCategoryMap = new Map<string, string | null>();

      const categoryContext = userCategories
        .map((c) => `- ID: "${c.id}", Label: "${c.label}"`)
        .join('\n');

      const systemPrompt = `
        You are an expert financial assistant. Categorize bank transactions based on their names.
        
        Available user categories (use ONLY these IDs):
        ${categoryContext}

        Rules:
        - Return ONLY clean valid JSON in the format of an array of objects: [{"title": "exact_transaction_title", "categoryId": "category_id"}]
        - If unsure, set "categoryId": null.
        CRITICAL: Output absolutely nothing but the JSON array. Do not include markdown backticks.
      `;

      // Step B: Process in chunks of 40 to avoid free-tier token limits/timeouts
      const CHUNK_SIZE = 40;

      for (let i = 0; i < uniqueTitles.length; i += CHUNK_SIZE) {
        const titleChunk = uniqueTitles.slice(i, i + CHUNK_SIZE);
        console.log(
          `Processing AI chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(uniqueTitles.length / CHUNK_SIZE)}`,
        );

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
            continue;
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
        } catch (error) {
          console.error(
            `Error processing AI chunk starting at index ${i}:`,
            error,
          );
          // We don't throw here; we just let it fail gracefully so the rest of the app continues
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
