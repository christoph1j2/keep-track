import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Transaction } from '@prisma/client';

/**
 * Represents the result of matching transactions to categories using heuristic methods.
 */
export interface MatchResult {
  matched: (Transaction & { categoryId: string; isAiCategorized: false })[];
  unmatched: Transaction[];
  categories: { id: string; label: string }[];
}

@Injectable()
export class HeuristicMatcherService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Matches transactions to categories using heuristic methods.
   * 
   * @param userId - The ID of the user for whom the transactions are being matched.
   * @param transactions - An array of transactions to be matched, each containing details such as title, amount, and date.
   * @returns - A promise that resolves to a MatchResult object, containing arrays of matched transactions, unmatched transactions, and available user categories.
   */
  async match(
    userId: string,
    transactions: Transaction[],
  ): Promise<MatchResult> {
    // Fetch the user's transaction history and categories from the database
    const history = await this.prisma.transaction.findMany({
      where: { userId, categoryId: { not: null } },
      select: { title: true, categoryId: true },
      distinct: ['title', 'categoryId'],
    });

    // Fetch the user's categories from the database
    const userCategories = await this.prisma.category.findMany({
      where: { userId },
      select: { id: true, label: true },
    });

    // If there are no user categories, return early with all transactions unmatched
    if (userCategories.length === 0) {
      return {
        matched: [],
        unmatched: transactions,
        categories: [],
      };
    }

    // Precompute the normalized titles of the user's transaction history for efficient matching
    const precomputedHistory = history.map((h) => ({
      ...h,
      pastTitle: h.title.toLowerCase().trim(),
    }));

    // Initialize arrays to hold the results of matched transactions and those that remain unmatched for AI processing
    const results: MatchResult['matched'] = [];
    const unmappedForAi: Transaction[] = [];

    // Iterate over each incoming transaction and attempt to match it to the user's transaction history using heuristic methods
    for (const incoming of transactions) {
      const lowerTitle = incoming.title.toLowerCase().trim();
      const match = precomputedHistory.find((h) => {
        const pastTitle = h.pastTitle;

        // 1. Exact match is always allowed
        if (lowerTitle === pastTitle) return true;

        // 2. Prevent fuzzy matching on very short strings to avoid false positives
        if (pastTitle.length < 5 || lowerTitle.length < 5) return false;

        // 3. Stricter substring matching (starts-with instead of includes anywhere)
        return (
          lowerTitle.startsWith(pastTitle) || pastTitle.startsWith(lowerTitle)
        );
      });

      // If a match is found and the matched category still exists in the user's categories, add it to the results; otherwise, add it to the list of transactions to be processed by AI
      if (match && userCategories.some((c) => c.id === match.categoryId)) {
        results.push({
          ...incoming,
          categoryId: match.categoryId!,
          isAiCategorized: false,
        });
      } else {
        unmappedForAi.push(incoming);
      }
    }
    return {
      matched: results,
      unmatched: unmappedForAi,
      categories: userCategories,
    };
  }
}
