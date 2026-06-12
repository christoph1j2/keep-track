import { useState, useEffect } from "react";
import type { Transaction } from "../types/transaction";

const STORAGE_KEY = "keep-track-transactions";

/**
 * Loads the initial transaction list from localStorage.
 * Falls back to an empty list when storage is unavailable, missing, or invalid.
 *
 * @returns Stored transactions, or an empty array when data cannot be recovered.
 */
function getInitialTransactions(): Transaction[] {
    if (typeof window === "undefined") return [];
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return [];
        const parsed: unknown = JSON.parse(savedData);
        return Array.isArray(parsed) ? (parsed as Transaction[]) : [];
    } catch (error) {
        console.error("Error parsing saved transactions:", error);
        return [];
    }
}

//! persistence, event-bus, SSoT
function persistTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    window.dispatchEvent(new Event('transactions-updated'));
}

/**
 * Keeps transaction state in sync with localStorage.
 * This hook is the main transaction source used by dashboard and overview screens.
 *
 * @returns Current transactions and mutation helpers for add, update, and delete actions.
 * @deprecated This hook is being replaced by a Zustand store for better performance and global state management. Use `useTransactionStore` instead.
 */
export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>(getInitialTransactions);

    // Listen for updates to transactions from other hook instances
    useEffect(() => {
        const handleTransactionsUpdated = () => {
            setTransactions(getInitialTransactions());
        };
        window.addEventListener('transactions-updated', handleTransactionsUpdated);
        return () => window.removeEventListener('transactions-updated', handleTransactionsUpdated);
    }, []);

    /**
      * Inserts a new transaction at the top of the list and persists the updated list.
      * Newest-first ordering keeps recent entries visible across UI views.
     *
      * @param newTransaction New transaction record to store.
     */
    const addTransaction = (newTransaction: Transaction) => {
        const current = getInitialTransactions();

        const transactionToAdd = current.some(t => t.id === newTransaction.id)
            ? { ...newTransaction, id: crypto.randomUUID() }
            : newTransaction;

        const updatedTransactions = [transactionToAdd, ...current];
        persistTransactions(updatedTransactions);
        setTransactions(updatedTransactions);
    };

    /**
      * Replaces a transaction with the same id and persists the result.
      * If no matching id exists, the list is effectively unchanged.
     *
      * @param updatedTransaction Transaction payload containing the existing id and updated fields.
     */
    const updateTransaction = (updatedTransaction: Transaction) => {
        const current = getInitialTransactions();
        const updatedTransactions = current.map(t =>
            t.id === updatedTransaction.id ? updatedTransaction : t
        );

        persistTransactions(updatedTransactions);
        setTransactions(updatedTransactions);
    }

    /**
     * Removes a transaction by id and persists the result.
     *
     * @param id Identifier of the transaction to remove.
     */
    const deleteTransaction = (id: string) => {
        const current = getInitialTransactions();
        const updatedTransactions = current.filter(t => t.id !== id);

        persistTransactions(updatedTransactions);
        setTransactions(updatedTransactions);
    }

    /**
     * Rewrites categoryId
     * 
     * @param oldCategoryId Identifier of the category to replace.
     * @param newCategoryId Identifier of the category to replace with.
     */
    const reassignCategory = (oldCategoryId: string, newCategoryId: string) => {
        const current = getInitialTransactions();
        const updatedTransactions = current.map(t =>
            t.categoryId === oldCategoryId ? { ...t, categoryId: newCategoryId } : t
        );

        persistTransactions(updatedTransactions);
        setTransactions(updatedTransactions);
    }

    /**
     * Clears all transactions from storage and state. Useful for testing or resetting the app.
     */
    const clearTransactions = () => {
        persistTransactions([]);
        setTransactions([]);
    }

    /**
     * Generates random mock data. Useful for development and testing when no real transactions exist.
     * 
     * @param generatedTransactions Generated transactions from util method
     */
    const loadMockData = (generatedTransactions: Transaction[]) => {
        persistTransactions(generatedTransactions);
        setTransactions(generatedTransactions);
    };

    return { transactions, addTransaction, updateTransaction, deleteTransaction, reassignCategory, clearTransactions, loadMockData };
}