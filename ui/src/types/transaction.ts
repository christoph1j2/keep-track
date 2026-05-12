/**
 * Core transaction record used for storage, summaries, and dashboard views.
 * Amounts follow the app convention: negative for expenses, positive for income.
 *
 * @property {string} id Unique transaction identifier.
 * @property {string} title User-facing label or description of the transaction.
 * @property {number} amount Money amount; negative indicates expense, positive indicates income (e.g., 50 for +50 CZK, -30.50 for -30.50 CZK).
 * @property {string} categoryId Reference to a category id (must exist in categories list).
 * @property {string} date Transaction date in ISO 8601 format (YYYY-MM-DD).
 */
export interface Transaction {
    id: string;
    title: string;
    amount: number;
    categoryId: string;
    date: string;
}