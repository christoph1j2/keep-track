import { create } from "zustand";
import type { Budget } from "../types/budget";
import { api } from "../utils/api";

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;

  fetchBudgets: () => Promise<void>;

  addBudget: (
    budgetData: Omit<
      Budget,
      "id" | "userId" | "createdAt" | "updatedAt" | "category"
    >,
  ) => Promise<void>;
  updateBudget: (
    id: string,
    updateData: Pick<Budget, "categoryId" | "limit">,
  ) => Promise<void>;

  removeBudget: (id: string) => Promise<void>;

  reorderBudgets: (newBudgets: Budget[]) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>()((set) => ({
  budgets: [],
  isLoading: false,

  fetchBudgets: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/budgets");
      set({ budgets: response.data });
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addBudget: async (budgetData) => {
    const response = await api.post("/budgets", budgetData);
    set((state) => ({ budgets: [...state.budgets, response.data] }));
  },

  updateBudget: async (id, updateData) => {
    const response = await api.patch(`/budgets/${id}`, updateData);
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? response.data : b)),
    }));
  },

  removeBudget: async (id) => {
    await api.delete(`/budgets/${id}`);
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
  },

  reorderBudgets: async (reorderedBudgets) => {
    set({ budgets: reorderedBudgets });

    const payload = reorderedBudgets.map((budget, index) => ({
      id: budget.id,
      order: index,
    }));

    try {
      await api.patch("/budgets/reorder", { budgets: payload });
    } catch (err) {
      console.error("Failed to reorder budgets:", err);
      // Optionally, you might want to refetch the budgets to ensure the state is consistent with the server
      await useBudgetStore.getState().fetchBudgets();
    }
  },
}));
