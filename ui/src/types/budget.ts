/**
 * Budget configuration for tracking spending limits against a category.
 * The budget limit is compared against total expenses (negative transactions) in the given category for the current month.
 *
 * @property categoryId - Unique identifier for the category this budget applies to.
 * @property limit - Monthly spending limit in CZK (Czech Koruna).
 */
export interface Budget {
    categoryId: string;
    limit: number;
}