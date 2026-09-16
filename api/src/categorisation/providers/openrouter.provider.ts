/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { OpenRouter } from '@openrouter/sdk';
import { LlmProvider } from './llm-provider.interface';
import { Injectable, Optional, Logger } from '@nestjs/common';

/**
 * Configuration interface for the OpenRouterProvider.
 */
export interface OpenRouterConfig {
  primaryModel: string;
  fallbackModels: string[];
}

/**
 * Default configuration for the OpenRouterProvider, specifying the primary and fallback models to be used for categorization.
 */
export const DEFAULT_OPENROUTER_CONFIG: OpenRouterConfig = {
  primaryModel: 'nvidia/nemotron-3-super-120b-a12b:free',
  fallbackModels: ['nvidia/nemotron-3.5-lightning:free', 'openrouter/free'],
};

/**
 * OpenRouterProvider is a service that provides an interface to the OpenRouter API for categorizing transactions.
 */
@Injectable()
export class OpenRouterProvider implements LlmProvider {
  private client: OpenRouter;
  private readonly CHUNK_SIZE = 30;
  private readonly config: OpenRouterConfig;
  private readonly logger = new Logger(OpenRouterProvider.name);

  constructor(
    @Optional() config: OpenRouterConfig = DEFAULT_OPENROUTER_CONFIG, // Use default config if none provided
  ) {
    this.config = config || DEFAULT_OPENROUTER_CONFIG;
    const apiKey = process.env.OPENROUTER_API_KEY;

    this.client = new OpenRouter({
      apiKey,
      appTitle: 'KeepTrack',
      httpReferer: process.env.FRONTEND_URL || 'http://localhost:5173',
    });
  }

  /**
   * Categorizes a list of transaction titles based on the provided categories.
   * 
   * @param titles - An array of transaction titles to be categorized.
   * @param categories - An array of category objects, each containing an ID and label, to be used for categorization.
   * @returns - A promise that resolves to an array of objects, each containing a title and its corresponding category ID (or null if no category was assigned).
   */
  async categorise(
    titles: string[],
    categories: { id: string; label: string }[],
  ): Promise<{ title: string; categoryId: string | null }[]> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Initialize the result array and build the system prompt for the AI model
    const res: { title: string; categoryId: string | null }[] = [];
    const systemPrompt = this.buildSystemPrompt(categories);

    // Loop through titles in chunks of CHUNK_SIZE
    for (let i = 0; i < titles.length; i += this.CHUNK_SIZE) {
      const chunk = titles.slice(i, i + this.CHUNK_SIZE);
      const chunkNum = Math.floor(i / this.CHUNK_SIZE) + 1;
      const totalChunks = Math.ceil(titles.length / this.CHUNK_SIZE);
      this.logger.log(
        `[LLM] 🤖 Processing AI chunk ${chunkNum} of ${totalChunks} (${chunk.length} titles)`,
      );
      // For each chunk: call OpenRouter with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      let chunkSuccess = false;
      let lastError: any = null;

      // Retry loop for calling the OpenRouter API
      while (attempts < maxAttempts) {
        try {
          // Call the OpenRouter API with the current chunk of titles and the system prompt
          const aiResponse = await this.client.chat.send({
            chatRequest: {
              // Primary model
              model: this.config.primaryModel,
              // Fallback models
              models: this.config.fallbackModels,
              responseFormat: { type: 'json_object' },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(chunk) },
              ],
              stream: false,
            },
          });

          // Extract the content from the AI response
          //// aiResponse - The response object returned by the OpenRouter API, containing the AI's categorization results.
          //// choices - An array of choices returned by the AI model, each containing a message with the categorization results.
          //// message - The message object containing the content of the AI's response.
          //// content - The actual content of the AI's response, which is expected to be a JSON string containing the categorization results.
          const content = aiResponse?.choices?.[0]?.message?.content;

          if (!content) {
            this.logger.warn(
              `[LLM] Returned empty response for chunk ${chunkNum}. Retrying...`,
            );
            attempts++;
            continue;
          }

          // Clean the content by removing any markdown formatting and trimming whitespace
          const cleanJson = content
            .replace(/```(json)?/gi, '')
            .replace(/```/g, '')
            .trim();

          // Parse the cleaned JSON content into a JavaScript object 
          let parsedData: any;
          try {
            parsedData = JSON.parse(cleanJson);
          } catch (err) {
            this.logger.error(
              `[LLM] Failed to parse JSON for chunk ${chunkNum}: ${cleanJson}`,
            );
            attempts++;
            continue;
          }

          // Extract the array of transaction items from the parsed data, handling different possible structures
          let itemsArray: any[] = [];

          // If the parsed data is an array, use it directly; if it's an object, look for an array inside its properties (e.g., results, items, data, transactions)
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

          // If itemsArray is valid and contains transaction items, process each item to extract the title and categoryId, logging the reasoning for each categorization
          if (Array.isArray(itemsArray) && itemsArray.length > 0) {
            // Process each item in the itemsArray to extract the title and categoryId, logging the reasoning for each categorization
            for (const item of itemsArray) {
              if (item && typeof item === 'object' && item.title) {
                res.push({
                  title: String(item.title),
                  categoryId: item.categoryId ? String(item.categoryId) : null,
                });
                this.logger.debug(
                  `[LLM Reasoning] ${item.title} -> ${item.categoryId || 'null'}: ${item.reasoning || 'No reasoning provided'}`,
                );
              }
            }
          } else {
            this.logger.warn(
              `[LLM] Chunk ${chunkNum} returned no valid transaction items.`,
            );
          }

          this.logger.log(
            `[LLM] ✅ AI chunk ${chunkNum} finished using model: ${aiResponse.model || 'unknown'}. ${res.filter((r) => r.categoryId).length} categorised so far`,
          );
          chunkSuccess = true;
          break; // Success
        } catch (error: any) {
          lastError = error;
          if (error?.statusCode === 429 || error?.status === 429) {
            attempts++;
            this.logger.warn(
              `[LLM] Rate limit hit. Retrying in ${5 * attempts} seconds... (Attempt ${attempts}/${maxAttempts})`,
            );
            // Wait for an increasing amount of time before retrying, to avoid hitting the rate limit again
            await this.sleep(5000 * attempts);
          } else {
            this.logger.error('[LLM] Error calling OpenRouter:', error);
            attempts++;
            if (attempts < maxAttempts) {
              await this.sleep(2000);
            }
          }
        }
      }

      // If the chunk was not successfully processed after the maximum number of attempts, log an error and throw an exception to indicate failure
      if (!chunkSuccess) {
        const errorMsg = `OpenRouter categorisation failed for chunk ${chunkNum} of ${totalChunks} (${chunk.length} titles unclassified) after ${maxAttempts} attempts.`;
        this.logger.error(`[LLM] ❌ ${errorMsg}`, lastError);
        throw new Error(errorMsg);
      }

      // Wait before processing the next chunk
      if (i + this.CHUNK_SIZE < titles.length) {
        await this.sleep(2000);
      }
    }

    return res;
  }

  /**
   * Builds the system prompt for the OpenRouter API.
   * 
   * @param categories - An array of category objects, each containing an ID and label, to be used for categorization.
   * @returns - A string containing the system prompt to be sent to the OpenRouter API, which includes instructions for categorizing transactions based on the provided categories and context.
   */
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

  /**
   * Puts the current thread to sleep for the specified number of milliseconds.
   * 
   * @param ms - The number of milliseconds to sleep.
   * @returns A promise that resolves after the specified time.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
