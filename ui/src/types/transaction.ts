/**
 * Core transaction record used for storage, summaries, and dashboard views.
 * Amounts follow the app convention: negative for expenses, positive for income.
 */
export interface Transaction {
    id: string;
    title: string; // nazev
    amount: number; // zaporne pro expenses, kladne pro income
    categoryId: string;
    date: string; // ISO string
}