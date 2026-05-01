export interface Transaction {
    id: string;
    title: string; // nazev
    amount: number; // zaporne pro expenses, kladne pro income
    categoryId: string;
    date: string; // ISO string
}