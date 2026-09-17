import type { Category } from "./category";

/**
 * Template for quickly creating transactions with predefined values.
 * Used to speed up data entry for frequently repeated transactions.
 */
export interface QuickAddTemplate {
  id: string;
  userId: string;
  title: string;
  amount: number;
  categoryId: string | null;
  showInHotbar: boolean;

  category?: Category | null;

  order: number;
}
