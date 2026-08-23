import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Transaction } from '@prisma/client';

export interface MatchResult {
  matched: (Transaction & { categoryId: string; isAiCategorized: false })[];
  unmatched: Transaction[];
  categories: { id: string; label: string }[];
}

@Injectable()
export class HeuristicMatcherService {
  constructor(private readonly prisma: PrismaService) {}

  async match(
    userId: string,
    transactions: Transaction[],
  ): Promise<MatchResult> {
    const history = await this.prisma.transaction.findMany({
      where: { userId, categoryId: { not: null } },
      select: { title: true, categoryId: true },
      distinct: ['title', 'categoryId'],
    });

    const userCategories = await this.prisma.category.findMany({
      where: { userId },
      select: { id: true, label: true },
    });

    if (userCategories.length === 0) {
      return {
        matched: [],
        unmatched: transactions,
        categories: [],
      };
    }

    const precomputedHistory = history.map((h) => ({
      ...h,
      pastTitle: h.title.toLowerCase().trim(),
    }));

    const results: MatchResult['matched'] = [];
    const unmappedForAi: Transaction[] = [];

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
