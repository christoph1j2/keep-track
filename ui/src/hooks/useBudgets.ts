import { useEffect, useState } from "react";
import type { Budget } from "../types/budget";

const STORAGE_KEY = "keep-track-budgets";

/**
 * Runtime check used when reading budgets from localStorage.
 * Protects the app from malformed or outdated saved data.
 *
 * @param obj Value to validate.
 * @returns True when the value matches the Budget shape.
 */
function isBudget(obj: unknown): obj is Budget {
    if (!obj || typeof obj !== "object") return false;
    const b = obj as Record<string, unknown>;
    return typeof b.categoryId === "string" && typeof b.limit === "number";
}
/**
 * Loads the initial budget list from localStorage.
 * Falls back to an empty list when storage is unavailable, missing, or invalid.
 *
 * @returns Stored budgets, or an empty array when data cannot be recovered.
 */
function getInitialBudgets(): Budget[] {
    if (typeof window === "undefined") return [];
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (!savedData) return [];
            const parsed: unknown = JSON.parse(savedData);
            return Array.isArray(parsed) && parsed.every(isBudget)
                ? parsed
                : [];
        } catch (error) {
            console.error("Error parsing saved budgets:", error);
            return [];
        }
}

// ! persistence, event-bus, SSoT
function persistBudgets(budgets: Budget[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
    window.dispatchEvent(new Event('budgets-updated'));
}

/**
 * Keeps budget state in sync with localStorage.
 * Budgets are linked to categories and define spending limits.
 *
 * @returns Current budgets and mutation helpers for set and remove actions.
 * @deprecated This hook is deprecated in favor of the Zustand store `useBudgetStore`.
 */
export function useBudgets() {
    const [budgets, setBudgets] = useState<Budget[]>(getInitialBudgets);

    // Listen for updates to budgets from other hook instances
    useEffect(() => {
        const handleBudgetsUpdated = () => {
            setBudgets(getInitialBudgets());
        };
        window.addEventListener('budgets-updated', handleBudgetsUpdated);

        return () => {
            window.removeEventListener('budgets-updated', handleBudgetsUpdated);
        };
    }, []);

    /**
     * Inserts or updates a budget for a category and persists the result.
     * If the category already has a budget, it is replaced with the new limit.
     *
     * @param categoryId Category identifier to set a budget for.
     * @param limit Spending limit in CZK.
     */
    const setBudget = (categoryId: string, limit: number) => {
        const current = getInitialBudgets();
        const exists = current.some(b => b.categoryId === categoryId);

        if (exists) {
            const updated = current.map(b =>
                b.categoryId === categoryId ? { ...b, categoryId, limit } as unknown as Budget : b
            );
            persistBudgets(updated);
            setBudgets(updated);
        } else {
            const newBudget = { categoryId, limit } as unknown as Budget;
            persistBudgets([...current, newBudget]);
            setBudgets([...current, newBudget]);
        }
    };

    /**
     * Removes a budget by category id and persists the result.
     *
     * @param id Identifier of the category whose budget should be removed.
     */
    const removeBudget = (id: string) => {
        const current = getInitialBudgets();
        const updated = current.filter(b => b.categoryId !== id);
        persistBudgets(updated);
        setBudgets(updated);
    };

    /**
     * Reorders the budgets according to the provided list and persists the new order.
     * 
     * @param reorderedBudgets 
     */
    const reorderBudgets = (reorderedBudgets: Budget[]) => {
        persistBudgets(reorderedBudgets);
        setBudgets(reorderedBudgets);
    };

    return { budgets, setBudget, removeBudget, reorderBudgets };
}