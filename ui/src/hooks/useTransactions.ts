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

/**
 * Keeps transaction state in sync with localStorage.
 * This hook is the main transaction source used by dashboard and overview screens.
 *
 * @returns Current transactions and mutation helpers for add, update, and delete actions.
 */
export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>(getInitialTransactions);

    // Naslouchej custom eventu, když se transakce změní v jiné instance hooků
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
        setTransactions((prev: Transaction[]) => {
            const updatedTransactions = [newTransaction, ...prev];
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
                window.dispatchEvent(new Event('transactions-updated'));
            } catch (error) {
                console.error("Error saving transactions:", error);
            }
            return updatedTransactions;
        })
    };

    /**
      * Replaces a transaction with the same id and persists the result.
      * If no matching id exists, the list is effectively unchanged.
     *
      * @param updatedTransaction Transaction payload containing the existing id and updated fields.
     */
    const updateTransaction = (updatedTransaction: Transaction) => {
        setTransactions((prev: Transaction[]) => {
            const newTransactions = prev.map(t => 
                t.id === updatedTransaction.id ? updatedTransaction : t
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
            window.dispatchEvent(new Event('transactions-updated'));
            return newTransactions;
        })
    }

    /**
     * Removes a transaction by id and persists the result.
     *
     * @param id Identifier of the transaction to remove.
     */
    const deleteTransaction = (id: string) => {
        setTransactions((prev: Transaction[]) => {
            const updatedTransactions = prev.filter((transaction) => transaction.id !== id);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
                window.dispatchEvent(new Event('transactions-updated'));
            } catch (error) {
                console.error("Error saving transactions:", error);
            }
            return updatedTransactions;
        })
    }

    /**
     * Rewrites categoryId
     * 
     * @param oldCategoryId Identifier of the category to replace.
     * @param newCategoryId Identifier of the category to replace with.
     */
    const reassignCategory = (oldCategoryId: string, newCategoryId: string) => {
        setTransactions((prev: Transaction[]) => {
            const newTransactions = prev.map(t =>
                // pokud ma transakce stare id, vratime jeji kopii s novym id
                t.categoryId === oldCategoryId ? { ...t, categoryId: newCategoryId } : t
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
            window.dispatchEvent(new Event('transactions-updated'));
            return newTransactions;
        });
    }


    return { transactions, addTransaction, updateTransaction, deleteTransaction, reassignCategory };
}