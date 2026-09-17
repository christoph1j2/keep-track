import type { Category } from "./category";

/**
 * Represents a budget for a specific category, including its limit and associated category details.
 */
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  limit: number;

  createdAt: string;
  updatedAt: string;

  category?: Category;

  order: number;
}

/**
 * Joiner M:N table for budgets and categories, representing the association between a complex budget and its categories.
 */
export interface ComplexBudgetCategoryItem {
  id: string;
  budgetId: string;
  categoryId: string;
  limit: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

/**
 * Represents a complex budget that includes multiple categories, each with its own limit and associated category details, as well as overall income and necessary expenses.
 */
export interface ComplexBudget {
  id: string;
  userId: string;
  income: number;
  necessaryExpenses: number;
  limit: number;
  createdAt: string;
  updatedAt: string;

  categories: ComplexBudgetCategoryItem[];
}

