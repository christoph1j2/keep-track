import { Inject, Injectable } from "@nestjs/common";
import { LLM_PROVIDER, type LlmProvider } from "./providers/llm-provider.interface";
import { HeuristicMatcherService } from "./heuristic-matcher.service";
import { Transaction } from "@prisma/client";
import { normaliseTitle } from "./helpers/title-normaliser";

export interface ProcessedTransaction {
    id: string;
    date: Date;
    title: string;
    amount: number;
    originalAmount: number;
    originalCurrency: string;
    exchangeRate?: number | null;
    categoryId: string | null;
    isAiCategorized: boolean;
}

@Injectable()
export class CategorisationService {
    constructor(
        private readonly heuristicMatcher: HeuristicMatcherService,
        @Inject(LLM_PROVIDER) private readonly llmProvider: LlmProvider,
    ) {}

    async categorise(
        userId: string,
        transactions: Transaction[],
        useAi: boolean = true,
    ): Promise<ProcessedTransaction[]> {
        // Step 1: Heuristic matching
        const { matched, unmatched, categories } = await this.heuristicMatcher.match(userId, transactions);

        // Step 2: if useAi is false, no categories or nothing unmatched, return early
        if (!useAi || categories.length === 0 || unmatched.length === 0) {
            return [
                ...matched,
                ...unmatched.map(t => ({ ...t, categoryId: null, isAiCategorized: false })),
            ];
        }

        // Step 3: Deduplicate titles before sending to LLM 
        // 3a. Create a mapping of original titles to normalized titles, so that we can deduplicate and still map back to the original titles later
        const originalToNormalizedMap = new Map<string, string>();
        for (const t of unmatched) {
            originalToNormalizedMap.set(t.title, normaliseTitle(t.title));
        }

        // 3b. Get unique normalized titles to send to LLM, saves tokens!
        const uniqueNormalizedTitles = [
            ...new Set(originalToNormalizedMap.values()),
        ];

        // 3c. Call LLM
        const llmResults = await this.llmProvider.categorise(uniqueNormalizedTitles, categories);

        // 3d. Create a mapping of normalized titles to category IDs for easy lookup
        const normalizedToCategoryMap = new Map<string, string | null>();
        for (const res of llmResults) {
            normalizedToCategoryMap.set(res.title, res.categoryId);
        }

        // Step 4: Map back to original transactions
        const llmProcessed = unmatched.map(t => {
            const normalized = originalToNormalizedMap.get(t.title);
            const categoryId = normalizedToCategoryMap.get(normalized!) ?? null;
            return {
                ...t,
                categoryId,
                isAiCategorized: !!categoryId,
            };
        });

        // Step 5: Combine results and return
        return [...matched, ...llmProcessed];
    }
}