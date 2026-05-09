import { useState } from "react";
import type { Transaction } from "../types/transaction";

const STORAGE_KEY = "keep-track-transactions";

/**
 * Reads the saved transaction list once during startup.
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
 * Keeps the transaction list in memory and syncs new entries into localStorage.
 *
 * @returns The current transactions and a helper for prepending a new one.
 */
export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>(getInitialTransactions);

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

    return { transactions, addTransaction };
}