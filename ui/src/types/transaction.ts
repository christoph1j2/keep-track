import type { Category } from "./category";

/**
 * Transaction record used for storage, filtering, and dashboard summaries.
 * Amount sign convention is stable across the app: negative for expenses, positive for income.
 */
export interface Transaction {
  id: string;
  userId: string; // Přidáno z backendu

  // CategoryId může být null, pokud uživatel kategorii smaže (Prisma onDelete: SetNull)
  categoryId: string | null;

  title: string;
  date: string; // ISO 8601 string vracený z API

  originalAmount: number;
  originalCurrency: string;
  amount: number; // Přepočtená hodnota do baseCurrency

  bankReferenceId?: string | null;
  isAiCategorized: boolean;

  createdAt: string;
  updatedAt: string;

  // Relace připojená z backendu (include: { category: true })
  category?: Category | null;
}
