export type CategoryType = 'INCOME' | 'EXPENSE'

/**
 * Represents a category used for organizing transactions, including its label, icon, color, and hierarchical structure.
 */
export interface Category {
  id: string;
  userId: string;
  label: string;
  iconName: string;
  colorClass: string;
  parentId?: string | null;

  order: number; 
  type: CategoryType;
}
