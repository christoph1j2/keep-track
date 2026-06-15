import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '../types/transaction';

// Co vše "sklad" obsahuje
interface TransactionState {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
    updateTransaction: (transaction: Transaction) => void;
    reassignCategory: (oldCategoryId: string, newCategoryId: string) => void;
    // For testing purposes
    clearTransactions: () => void;
    loadMockData: (data: Transaction[]) => void;
}

export const useTransactionStore = create<TransactionState>()(
    persist(
        (set) => ({
            // vychozi stav
            transactions: [] as Transaction[],
            
            // uprava stavu
            addTransaction: (transactionData) => {
                set((state) => {
                    const newTransaction: Transaction = {
                        ...transactionData,
                        id: crypto.randomUUID(), // generování unikátního ID
                    };
                    return { transactions: [...state.transactions, newTransaction] };
                })
            },
            updateTransaction: (updatedTransaction: Transaction) => {
                set((state) => {
                    return {
                        transactions: state.transactions.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)),
                    };
                })
            },
            deleteTransaction: (id) => {
                set((state) => {
                    return { transactions: state.transactions.filter((t) => t.id !== id) };
                })
            },
            reassignCategory: (oldCategoryId, newCategoryId) => {
                set((state) => {
                    return {
                        transactions: state.transactions.map((t) =>
                            t.categoryId === oldCategoryId ? { ...t, categoryId: newCategoryId } : t
                        ),
                    };
                })
            },
            clearTransactions: () => set({ transactions: [] }),
            loadMockData: (data) => set({ transactions: data }),
        }),
        {
            name: 'keep-track-transactions', // název pro localStorage
        }
    )
)