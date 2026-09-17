import { create } from "zustand";
import type { Budget, ComplexBudget } from "../types/budget";
import { api } from "../utils/api";

/**
 * BudgetState interface defines the structure of the budget state managed by the budget store.
 */
interface BudgetState {
  budgets: Budget[];
  complexBudget: ComplexBudget | null;
  isLoading: boolean;

  /**
   * Fetches the list of category budgets from the API and updates the state.
   */
  fetchBudgets: () => Promise<void>;

  /**
   * Fetches the complex budget overview (income, necessary expenses, category limits) from the API.
   */
  fetchComplexBudget: () => Promise<void>;

  /**
   * Adds a new category budget limit by sending a POST request to the API.
   *
   * @param budgetData - New budget details (categoryId, limit, etc.) excluding server-generated fields.
   */
  addBudget: (
    budgetData: Omit<
      Budget,
      "id" | "userId" | "createdAt" | "updatedAt" | "category"
    >,
  ) => Promise<void>;

  /**
   * Updates an existing category budget limit by sending a PATCH request to the API.
   *
   * @param id - The unique identifier of the budget to update.
   * @param updateData - The fields to update (categoryId and/or limit amount).
   */
  updateBudget: (
    id: string,
    updateData: Pick<Budget, "categoryId" | "limit">,
  ) => Promise<void>;

  /**
   * Deletes a category budget limit by sending a DELETE request to the API.
   *
   * @param id - The unique identifier of the budget to remove.
   */
  removeBudget: (id: string) => Promise<void>;

  /**
   * Sets or updates the complex budget configuration (income, necessary expenses, and category allocations).
   *
   * @param income - Monthly expected income.
   * @param necessaryExpenses - Fixed or essential monthly expenses.
   * @param categories - Optional array of category allocations with specific spending limits.
   */
  setComplexBudget: (
    income: number,
    necessaryExpenses: number,
    categories?: { categoryId: string; limit: number }[],
  ) => Promise<void>;

  /**
   * Deletes the complex budget configuration from the server and resets local state to null.
   */
  removeComplexBudget: () => Promise<void>;

  /**
   * Optimistically reorders the category budgets in local state and persists the new order to the API.
   *
   * @param newBudgets - The reordered list of budgets to apply and persist.
   */
  reorderBudgets: (newBudgets: Budget[]) => Promise<void>;
}

/**
 * Custom hook for managing the budget state.
 */
export const useBudgetStore = create<BudgetState>()((set) => ({
  budgets: [],
  complexBudget: null,
  isLoading: true,

  /**
   * Fetches the list of budgets from the API and updates the state accordingly.
   */
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

  /**
   * Fetches the complex budget from the API and updates the state accordingly.
   */
  fetchComplexBudget: async () => {
    try {
      const response = await api.get("/budgets/complex");
      set({ complexBudget: response.data ?? null });
    } catch (err) {
      console.error("Failed to fetch complex budget:", err);
      set({ complexBudget: null });
    }
  },

  /**
   * Adds a new budget by sending a POST request to the API and updating the state with the new budget.
   *
   * @param budgetData - New budget details excluding server-managed properties.
   */
  addBudget: async (budgetData) => {
    const response = await api.post("/budgets", budgetData);
    set((state) => ({ budgets: [...state.budgets, response.data] }));
  },

  /**
   * Updates an existing budget by sending a PATCH request to the API and updating the state with the modified budget.
   *
   * @param id - The ID of the budget to update.
   * @param updateData - Updated category ID and/or spending limit.
   */
  updateBudget: async (id, updateData) => {
    const response = await api.patch(`/budgets/${id}`, updateData);
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? response.data : b)),
    }));
  },

  /**
   * Removes a budget by sending a DELETE request to the API and filtering out the removed budget from state.
   *
   * @param id - The ID of the budget to delete.
   */
  removeBudget: async (id) => {
    await api.delete(`/budgets/${id}`);
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
  },

  /**
   * Sets the complex budget by sending a POST request to the API and updating the state with the new complex budget.
   *
   * @param income - Monthly expected income amount.
   * @param necessaryExpenses - Fixed or essential monthly expenses.
   * @param categories - Optional array of category limit overrides.
   */
  setComplexBudget: async (income, necessaryExpenses, categories) => {
    const response = await api.post("/budgets/complex", {
      income,
      necessaryExpenses,
      categories,
    });
    set({ complexBudget: response.data });
  },

  /**
   * Removes the complex budget by sending a DELETE request to the API and resetting the state to null.
   */
  removeComplexBudget: async () => {
    await api.delete("/budgets/complex");
    set({ complexBudget: null });
  },

  /**
   * Reorders the budgets by sending a PATCH request to the API with the new order and updating the state accordingly.
   * Refetches the budgets if the server sync fails.
   *
   * @param reorderedBudgets - The reordered list of budgets to apply.
   */
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
      // Refetch budgets to ensure the state is consistent with the server
      await useBudgetStore.getState().fetchBudgets();
    }
  },
}));
