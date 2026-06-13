import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Budget } from '../types/budget';

interface BudgetState {
    budgets: Budget[];
    setBudget: (categoryId: string, limit: number) => void;
    removeBudget: (categoryId: string) => void;
    reorderBudgets: (reorderedBudgets: Budget[]) => void;
}

export const useBudgetStore = create<BudgetState>()(
    persist(
        (set) => ({
            budgets: [],

            setBudget: (categoryId, limit) =>
                set((state) => {
                    const exists = state.budgets.some(b => b.categoryId === categoryId);

                    if (exists) {
                        return {
                            budgets: state.budgets.map(b =>
                                b.categoryId === categoryId ? { categoryId, limit } : b
                            )
                        };
                    }

                    return { budgets: [...state.budgets, { categoryId, limit }] };
                }),
            
            removeBudget: (categoryId) =>
                set((state) => ({
                    budgets: state.budgets.filter(b => b.categoryId !== categoryId)
                })),

            reorderBudgets: (reorderedBudgets) =>
                set({
                    budgets: reorderedBudgets
                }),
        }),
        {
            name: 'keep-track-budgets'
        }
    )
);