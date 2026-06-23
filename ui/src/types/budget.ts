import type { Category } from "./category";

/**
 * Budget configuration for tracking spending limits against a category.
 * The budget limit is compared against total expenses (negative transactions) in the given category for the current month.
 */
export interface Budget {
  id: string; // Přidáno ID (chybělo v původním souboru)
  userId: string;
  categoryId: string;
  limit: number; // Hodnota v baseCurrency uživatele (už ne napevno CZK)

  createdAt: string;
  updatedAt: string;

  // Relace připojená z backendu (include: { category: true })
  category?: Category;
}
