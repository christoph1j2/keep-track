import { OpenRouter } from "@openrouter/sdk";
import { LlmProvider } from "./llm-provider.interface";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OpenRouterProvider implements LlmProvider {
    private client: OpenRouter;
    private readonly CHUNK_SIZE = 80;

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
        categories: { id: string; label: string}[],
    ): Promise<{ title: string; categoryId: string | null }[]> {
        const res: { title: string; categoryId: string | null }[] = [];
        const systemPropt = this.buildSystemPrompt(categories);

        // Loop through titles in chunks of CHUNK_SIZE
        for (let i = 0; i < titles.length; i += this.CHUNK_SIZE) {
            const chunk = titles.slice(i, i + this.CHUNK_SIZE);
            const chunkNum = Math.floor(i / this.CHUNK_SIZE) + 1;
            const totalChunks = Math.ceil(titles.length / this.CHUNK_SIZE);
            console.log(`[LLM] 🤖 Processing AI chunk ${chunkNum} of ${totalChunks} (${chunk.length} titles)`);
            // For each chunk: call OpenRouter with retry logic
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    const aiResponse = await this.client.chat.send({
                        chatRequest: {
                            // Primary
                            model: "google/gemma-4-26b-a4b-it:free",
                            // Fallback
                            models: ["openrouter/free"],
                            responseFormat: { type: "json_object"},
                            messages: [
                                { role: "system", content: systemPropt },
                                { role: "user", content: JSON.stringify(chunk) }
                            ],
                            stream: false,
                        },
                    });
                    // Parse the response and push to res
                    const content = aiResponse?.choices?.[0]?.message?.content;
                    if (!content){
                        console.warn(`LLM returned empty response for chunk ${i}. Skipping chunk.`);
                        break;
                    }
                    const cleanJson = content.replace(/```(json)?/gi, '').trim();
                    let parsedData = JSON.parse(cleanJson);
                    if (
                        !Array.isArray(parsedData) &&
                        typeof parsedData === 'object' &&
                        parsedData !== null
                    ) {
                        const extractedArray = Object.values(parsedData).find((val) =>
                            Array.isArray(val)
                        );
                        parsedData = extractedArray || [];
                    }

                    if (Array.isArray(parsedData)) {
                        for (const item of parsedData) {
                            if (item.title) {
                                res.push({
                                    title: item.title,
                                    categoryId: item.categoryId || null,
                                });
                                console.log(`[LLM Reasoning] ${item.title} -> ${item.categoryId || 'null'}: ${item.reasoning || 'No reasoning provided'}`);
                            }
                        }
                    }
                    console.log(
                        `[LLM] ✅ AI chunk ${chunkNum} finished using model: ${aiResponse.model || 'unknown'}. ${res.filter(r => r.categoryId).length} categorised so far`,
                    );
                    break; // Success
                } catch (error: any) {
                    if (error.statusCode === 429) {
                        attempts++;
                        console.warn(`Rate limit hit. Retrying in ${10*attempts} seconds... (Attempt ${attempts}/${maxAttempts})`);
                        await this.sleep(10000*attempts); // Exponential backoff
                    } else {
                        console.error('LLM error:', error);
                        break; // Break on non-rate limit errors
                    }
                }
            }

            if (i + this.CHUNK_SIZE < titles.length) {
                await this.sleep(5000);
            }
        }

        return res;
    }

    private buildSystemPrompt(categories: { id: string; label: string}[]): string {
        const systemPrompt = `
        You are an expert financial assistant specializing in the Czech Republic and European markets. 
        Your task is to categorize bank transactions based on their merchant names.

        Available user categories (use ONLY these IDs):
        ${categories.map((cat) => `- ID: ${cat.id}, Label: ${cat.label}`).join('\n')}

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
        1. Return ONLY clean valid JSON in the format of an array of objects: [{"title": "exact_transaction_title", "categoryId": "category_id", "reasoning": "brief explanation of your choice"}]
        2. If *ABSOLUTELY* unsure, set "categoryId": null and explain why in "reasoning".
        3. Ignore corporate filler words like "a.s.", "s.r.o.", "z.s.", city names, or phrases like "platba kartou". Focus on the core merchant name to make your decision.
        4. CRITICAL: Output absolutely nothing but the JSON array. Do not include markdown backticks outside the JSON.
      `;

      return systemPrompt;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}