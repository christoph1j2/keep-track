export type CategoryType = 'INCOME' | 'EXPENSE'

/**
 * Category record used to group transactions and render category visuals.
 * Optional parentId enables a two-level hierarchy in the overview tree.
 */
export interface Category {
  id: string;
  userId: string; // Přidáno z backendu
  label: string;
  iconName: string;
  colorClass: string;
  parentId?: string | null;

  order: number; // Přidáno z backendu
  type: CategoryType;
}
