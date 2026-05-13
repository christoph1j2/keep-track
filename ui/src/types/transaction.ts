/**
 * Transaction record used for storage, filtering, and dashboard summaries.
 * Amount sign convention is stable across the app: negative for expenses, positive for income.
 *
 * @property {string} id Unique transaction identifier.
 * @property {string} title User-facing name shown in lists and cards.
 * @property {number} amount Amount in CZK, where negative is expense and positive is income.
 * @property {string} categoryId Category identifier linked to the category dataset.
 * @property {string} date Date string in ISO format.
 */
export interface Transaction {
    id: string;
    title: string;
    amount: number;
    categoryId: string;
    date: string;
}