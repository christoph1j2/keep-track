import { create } from "zustand";
import type { Transaction } from "../types/transaction";
import { api } from "../utils/api";

// Co vše "sklad" obsahuje
interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;

  fetchTransactions: () => Promise<void>;

  addTransaction: (
    transactionData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt" | "category"
    >,
  ) => Promise<void>;

  updateTransaction: (
    updatedTransaction: Omit<
      Transaction,
      "userId" | "createdAt" | "updatedAt" | "category"
    >,
  ) => Promise<void>;

  deleteTransaction: (id: string) => Promise<void>;

  reassignCategory: (
    oldCategoryId: string,
    newCategoryId: string,
  ) => Promise<void>;

  addTransactionsBatch: (
    transactionsData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt" | "category"
    >[],
  ) => Promise<void>;

  //   clearTransactions: () => void;
  //   loadMockData: (data: Transaction[]) => void;
}

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  isLoading: false,

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/transactions");
      set({ transactions: response.data, isLoading: false });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      set({ isLoading: false });
    }
  },

  addTransaction: async (transactionData) => {
    try {
      const response = await api.post("/transactions", transactionData);
      set((state) => ({
        transactions: [response.data, ...state.transactions],
      }));
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  },

  updateTransaction: async (updatedTransaction) => {
    const { id, ...data } = updatedTransaction as Transaction;
    const response = await api.patch(`/transactions/${id}`, data);
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? response.data : t,
      ),
    }));
  },

  deleteTransaction: async (id) => {
    await api.delete(`/transactions/${id}`);

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  reassignCategory: async (oldCategoryId, newCategoryId) => {
    const state = get();

    const toUpdate = state.transactions.filter(
      (t) => t.categoryId === oldCategoryId,
    );

    await Promise.all(
      toUpdate.map((t) =>
        api.patch(`/transactions/${t.id}`, { categoryId: newCategoryId }),
      ),
    );

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.categoryId === oldCategoryId
          ? { ...t, categoryId: newCategoryId }
          : t,
      ),
    }));
  },

  addTransactionsBatch: async (transactionsData) => {
    try {
      await api.post("/transactions/batch", {
        transactions: transactionsData,
      });

      const freshData = await api.get("/transactions");

      set({ transactions: freshData.data });
    } catch (error) {
      console.error("Error adding transactions batch:", error);
      throw error;
    }
  },
}));
