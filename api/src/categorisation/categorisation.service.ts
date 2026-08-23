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
        console.log(
            `[Categorisation] 📊 Started: ${transactions.length} transactions for user ${userId} (useAi: ${useAi})`,
        );

        // Step 1: Heuristic matching
        const { matched, unmatched, categories } = await this.heuristicMatcher.match(userId, transactions);
        console.log(
            `[Categorisation] 🔍 Local heuristics: ${matched.length} matched locally, ${unmatched.length} unmatched (${categories.length} user categories available)`,
        );

        // Step 2: if useAi is false, no categories or nothing unmatched, return early
        if (!useAi || categories.length === 0 || unmatched.length === 0) {
            const reason = !useAi
                ? 'AI disabled'
                : categories.length === 0
                    ? 'no user categories'
                    : 'all matched locally';
            console.log(
                `[Categorisation] ⏭️ Skipping AI categorisation (${reason}). Returning ${matched.length} matched + ${unmatched.length} uncategorised.`,
            );
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
        console.log(
            `[Categorisation] 🧹 Deduplication: ${unmatched.length} transactions → ${uniqueNormalizedTitles.length} unique titles to send to AI`,
        );

        // 3c. Call LLM
        const llmResults = await this.llmProvider.categorise(uniqueNormalizedTitles, categories);

        // 3d. Create a mapping of normalized titles to category IDs for easy lookup
        const normalizedToCategoryMap = new Map<string, string | null>();
        for (const res of llmResults) {
            if (res && res.title) {
                const normKey = normaliseTitle(res.title);
                normalizedToCategoryMap.set(normKey, res.categoryId);
            }
        }

        // Step 4: Map back to original transactions
        const llmProcessed = unmatched.map(t => {
            const normalized = originalToNormalizedMap.get(t.title) ?? normaliseTitle(t.title);
            const hasMatch = normalizedToCategoryMap.has(normalized);
            if (!hasMatch) {
                console.warn(
                    `[Categorisation] ⚠️ LLM result lookup miss for title: "${t.title}" (normalized: "${normalized}")`,
                );
            }
            const categoryId = hasMatch ? (normalizedToCategoryMap.get(normalized) ?? null) : null;
            return {
                ...t,
                categoryId,
                isAiCategorized: !!categoryId,
            };
        });

        // Step 5: Combine and log final results
        const allResults = [...matched, ...llmProcessed];
        const aiCategorized = llmProcessed.filter(r => r.isAiCategorized).length;
        const uncategorized = llmProcessed.filter(r => !r.categoryId).length;
        console.log(
            `[Categorisation] 📋 Final results: ${matched.length} local matches, ${aiCategorized} AI categorised, ${uncategorized} uncategorised (${allResults.length} total)`,
        );

        return allResults;
    }
}