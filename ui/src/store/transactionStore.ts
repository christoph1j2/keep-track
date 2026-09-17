import { create } from "zustand";
import type { Transaction } from "../types/transaction";
import { api } from "../utils/api";

/**
 * TransactionState interface defines the structure of the transaction state
 * and action methods managed by the transaction store.
 */
interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;

  /**
   * Fetches the full list of transactions for the authenticated user from the API.
   */
  fetchTransactions: () => Promise<void>;

  /**
   * Adds a new single transaction by sending a POST request to the API.
   *
   * @param transactionData - Transaction attributes (amount, date, title, categoryId, etc.) excluding server-assigned fields.
   * @throws Re-throws any error encountered during the API call.
   */
  addTransaction: (
    transactionData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt" | "category"
    >,
  ) => Promise<void>;

  /**
   * Updates an existing transaction by sending a PATCH request to the API.
   *
   * @param updatedTransaction - Updated transaction payload including its id.
   */
  updateTransaction: (
    updatedTransaction: Omit<
      Transaction,
      "userId" | "createdAt" | "updatedAt" | "category"
    >,
  ) => Promise<void>;

  /**
   * Deletes a single transaction by sending a DELETE request to the API.
   *
   * @param id - The unique identifier of the transaction to remove.
   */
  deleteTransaction: (id: string) => Promise<void>;

  /**
   * Reassigns all transactions from an old category to a new target category.
   *
   * @param oldCategoryId - The ID of the category being replaced.
   * @param newCategoryId - The ID of the replacement category.
   */
  reassignCategory: (
    oldCategoryId: string,
    newCategoryId: string,
  ) => Promise<void>;

  /**
   * Inserts multiple transactions in a single batch request and refreshes transactions from the server.
   *
   * @param transactionsData - Array of transaction objects to import or create in batch.
   * @throws Re-throws any error encountered during the batch API call.
   */
  addTransactionsBatch: (
    transactionsData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt" | "category"
    >[],
  ) => Promise<void>;
}

/**
 * Custom hook for managing transaction state and operations.
 */
export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  isLoading: true,

  /**
   * Fetches transactions from the API and updates the store state.
   */
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

  /**
   * Adds a new transaction via the API and prepends it to the current list.
   *
   * @param transactionData - New transaction details.
   * @throws Re-throws the API error if creation fails.
   */
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

  /**
   * Updates an existing transaction via the API and updates the local state.
   *
   * @param updatedTransaction - The transaction object containing updated fields and id.
   */
  updateTransaction: async (updatedTransaction) => {
    const { id, ...data } = updatedTransaction as Transaction;
    const response = await api.patch(`/transactions/${id}`, data);
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? response.data : t,
      ),
    }));
  },

  /**
   * Deletes a transaction by ID via the API and filters it out of local state.
   *
   * @param id - The ID of the transaction to delete.
   */
  deleteTransaction: async (id) => {
    await api.delete(`/transactions/${id}`);

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  /**
   * Reassigns all transactions associated with an old category to a new category ID.
   *
   * @param oldCategoryId - The current category ID to match.
   * @param newCategoryId - The new category ID to apply.
   */
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

  /**
   * Submits a batch of transactions to the API and updates local state with fresh data from the server.
   *
   * @param transactionsData - Array of transactions to create.
   * @throws Re-throws the API error if the batch request fails.
   */
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
