import { useState } from "react";
import type { Transaction } from "../types/transaction";

const STORAGE_KEY = "keep-track-transactions";

/**
 * Reads the saved transaction list from localStorage during component mount.
 * Returns an empty array if localStorage is unavailable, data is missing, or JSON parsing fails.
 *
 * @returns Array of saved transactions or empty array as fallback.
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

/**
 * Manages transaction state with localStorage persistence.
 * Loads saved transactions on mount, syncs updates back to storage.
 *
 * @returns Object with `transactions` array, `addTransaction()` method, and `updateTransaction()` method.
 */
export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>(getInitialTransactions);

    /**
     * Prepends a new transaction to the list and persists to localStorage.
     * Updates React state immediately and handles localStorage errors gracefully.
     *
     * @param newTransaction Transaction to add (typically with new id and current date).
     */
    const addTransaction = (newTransaction: Transaction) => {
        setTransactions((prev: Transaction[]) => {
            const updatedTransactions = [newTransaction, ...prev];
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
            } catch (error) {
                console.error("Error saving transactions:", error);
            }
            return updatedTransactions;
        })
    };

    /**
     * Updates an existing transaction by id and persists changes to localStorage.
     * Finds the transaction by id and replaces it; no-op if id not found.
     *
     * @param updatedTransaction Transaction with updated fields and matching id.
     */
    const updateTransaction = (updatedTransaction: Transaction) => {
        setTransactions((prev: Transaction[]) => {
            const newTransactions = prev.map(t => 
                t.id === updatedTransaction.id ? updatedTransaction : t
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
            return newTransactions;
        })
    }

    return { transactions, addTransaction, updateTransaction };
}