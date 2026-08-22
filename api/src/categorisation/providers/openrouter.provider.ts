/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { OpenRouter } from '@openrouter/sdk';
import { LlmProvider } from './llm-provider.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenRouterProvider implements LlmProvider {
  private client: OpenRouter;
  private readonly CHUNK_SIZE = 30;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    this.client = new OpenRouter({
      apiKey,
      appTitle: 'KeepTrack',
      httpReferer: process.env.FRONTEND_URL || 'http://localhost:5173',
    });
  }

  async categorise(
    titles: string[],
    categories: { id: string; label: string }[],
  ): Promise<{ title: string; categoryId: string | null }[]> {
    const res: { title: string; categoryId: string | null }[] = [];
    const systemPrompt = this.buildSystemPrompt(categories);

    // Loop through titles in chunks of CHUNK_SIZE
    for (let i = 0; i < titles.length; i += this.CHUNK_SIZE) {
      const chunk = titles.slice(i, i + this.CHUNK_SIZE);
      const chunkNum = Math.floor(i / this.CHUNK_SIZE) + 1;
      const totalChunks = Math.ceil(titles.length / this.CHUNK_SIZE);
      console.log(
        `[LLM] 🤖 Processing AI chunk ${chunkNum} of ${totalChunks} (${chunk.length} titles)`,
      );
      // For each chunk: call OpenRouter with retry logic
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const aiResponse = await this.client.chat.send({
            chatRequest: {
              // Primary model
              model: 'nvidia/nemotron-3-super-120b-a12b:free',
              // Fallback models
              models: ['nvidia/nemotron-3.5-lightning:free', 'openrouter/free'],
              responseFormat: { type: 'json_object' },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(chunk) },
              ],
              stream: false,
            },
          });

          const content = aiResponse?.choices?.[0]?.message?.content;

          if (!content) {
            console.warn(
              `[LLM] Returned empty response for chunk ${chunkNum}. Retrying...`,
            );
            attempts++;
            continue;
          }

          const cleanJson = content
            .replace(/```(json)?/gi, '')
            .replace(/```/g, '')
            .trim();

          let parsedData: any;
          try {
            parsedData = JSON.parse(cleanJson);
          } catch (err) {
            console.error(
              `[LLM] Failed to parse JSON for chunk ${chunkNum}:`,
              cleanJson,
            );
            attempts++;
            continue;
          }

          let itemsArray: any[] = [];

          if (Array.isArray(parsedData)) {
            itemsArray = parsedData;
          } else if (typeof parsedData === 'object' && parsedData !== null) {
            // If response is a single transaction object
            if (
              'title' in parsedData &&
              ('categoryId' in parsedData || 'reasoning' in parsedData)
            ) {
              itemsArray = [parsedData];
            } else {
              // Look for an array inside object properties (e.g., results, items, data, transactions)
              const extractedArray = Object.values(parsedData).find((val) =>
                Array.isArray(val),
              ) as any[];
              itemsArray = extractedArray || [];
            }
          }

          if (Array.isArray(itemsArray) && itemsArray.length > 0) {
            for (const item of itemsArray) {
              if (item && typeof item === 'object' && item.title) {
                res.push({
                  title: String(item.title),
                  categoryId: item.categoryId ? String(item.categoryId) : null,
                });
                console.log(
                  `[LLM Reasoning] ${item.title} -> ${item.categoryId || 'null'}: ${item.reasoning || 'No reasoning provided'}`,
                );
              }
            }
          } else {
            console.warn(
              `[LLM] Chunk ${chunkNum} returned no valid transaction items.`,
            );
          }

          console.log(
            `[LLM] ✅ AI chunk ${chunkNum} finished using model: ${aiResponse.model || 'unknown'}. ${res.filter((r) => r.categoryId).length} categorised so far`,
          );
          break; // Success
        } catch (error: any) {
          if (error?.statusCode === 429 || error?.status === 429) {
            attempts++;
            console.warn(
              `[LLM] Rate limit hit. Retrying in ${5 * attempts} seconds... (Attempt ${attempts}/${maxAttempts})`,
            );
            await this.sleep(5000 * attempts);
          } else {
            console.error('[LLM] Error calling OpenRouter:', error);
            attempts++;
            if (attempts < maxAttempts) {
              await this.sleep(2000);
            }
          }
        }
      }

      if (i + this.CHUNK_SIZE < titles.length) {
        await this.sleep(2000);
      }
    }

    return res;
  }

  private buildSystemPrompt(
    categories: { id: string; label: string }[],
  ): string {
    const systemPrompt = `
        You are an expert financial assistant specializing in the Czech Republic and European markets. 
        Your task is to categorize bank transactions based on their merchant names.

        Available user categories (use ONLY these IDs):
        ${categories.map((cat) => `- ID: ${cat.id}, Label: ${cat.label}`).join('\n')}

        Context & Cheat Sheet for common (Czech/European) merchants:
        - Groceries/Supermarkets: Tesco, Kaufland, Albert, Lidl, Penny, Billa, Globus, Makro, Coop.
        - Public Transport/Trains: ČD (České dráhy), PMDP (Plzeňské městské dopravní podniky), RegioJet, FlixBus, Leo Express, IDS, DPP (Dopravní podnik Praha), GW Train.
        - Drugstores/Cosmetics: dm drogerie, Teta, Rossmann, Notino.
        - Food/Restaurants: Wolt, Foodora, Bolt Food, McDonald's, KFC, Burger King, UGO.
        - Tech/Hobby: Alza, CZC, Datart, Hornbach, OBI, Bauhaus.
        - Utilities/Services: E.ON, ČEZ, Pražská plynárenská, Vodafone, O2, T-Mobile.
        - Entertainment/Streaming: Netflix, Spotify, HBO Max, Disney+, Apple TV+, YouTube Music.
        - Salary: Vyplata, Payroll, Salary, mzda, výplata.

        Rules:
        1. Return ONLY clean valid JSON in the format of an object with a "results" key containing an array:
           {
             "results": [
               {
                 "title": "exact_transaction_title",
                 "categoryId": "category_id_or_null",
                 "reasoning": "brief explanation of your choice"
               }
             ]
           }
        2. You MUST categorize or evaluate every single transaction title provided in the array.
        3. If *ABSOLUTELY* unsure or no category fits, set "categoryId": null and explain why in "reasoning".
        4. Ignore corporate filler words like "a.s.", "s.r.o.", "z.s.", city names, or phrases like "platba kartou". Focus on the core merchant name.
        5. CRITICAL: Output absolutely nothing but the JSON object. Do not include markdown backticks outside the JSON.
      `;

    return systemPrompt;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
