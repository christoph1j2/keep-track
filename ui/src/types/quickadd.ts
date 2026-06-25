import type { Category } from "./category";

/**
 * Template for quickly creating transactions with predefined values.
 * Used to speed up data entry for frequently repeated transactions.
 */
export interface QuickAddTemplate {
  id: string;
  userId: string; // Přidáno z backendu
  title: string;
  amount: number; // Hodnota v baseCurrency uživatele
  categoryId: string;
  showInHotbar: boolean;

  // Relace připojená z backendu (include: { category: true })
  category?: Category;

  order: number; // Přidáno z backendu
}
