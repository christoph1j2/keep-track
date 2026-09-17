import type { Category } from "./category";

/**
 * Transaction record used for storage, filtering, and dashboard summaries.
 * Amount sign convention is stable across the app: negative for expenses, positive for income.
 */
export interface Transaction {
  id: string;
  userId: string; 

  categoryId: string | null;

  title: string;
  date: string; // ISO 8601 string 

  originalAmount: number;
  originalCurrency: string;
  exchangeRate?: number | null; 
  amount: number;

  bankReferenceId?: string | null;
  isAiCategorized: boolean;

  createdAt: string;
  updatedAt: string;

  category?: Category | null;
}
