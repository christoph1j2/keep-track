import { useState } from "react";
import type { Transaction } from "../types/transaction";

const STORAGE_KEY = "keep-track-transactions";

// lazy init
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

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>(getInitialTransactions);

    // pridat novou transakci
    const addTransaction = (newTransaction: Transaction) => {
        setTransactions((prev: Transaction[]) => {
            const updatedTransactions = [newTransaction, ...prev];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
            return updatedTransactions;
        })
    };

    return { transactions, addTransaction };
}