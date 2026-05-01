import { useState } from "react";
import type { Transaction } from "../types/transaction";

const STORAGE_KEY = "keep-track-transactions";

// lazy init
function getInitialTransactions(): Transaction[] {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        return JSON.parse(savedData);
    }
    return [];
}

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>(getInitialTransactions);

    // pridat novou transakci
    const addTransaction = (newTransaction: Transaction) => {
        const updatedTransactions = [newTransaction, ...transactions];
        setTransactions(updatedTransactions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
    };

    return { transactions, addTransaction };
}