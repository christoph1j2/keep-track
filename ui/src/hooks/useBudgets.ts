import { useState } from "react";
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
 */function getInitialBudgets(): Budget[] {
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

/**
 * Keeps budget state in sync with localStorage.
 * Budgets are linked to categories and define spending limits.
 *
 * @returns Current budgets and mutation helpers for set and remove actions.
 */
export function useBudgets() {
    const [budgets, setBudgets] = useState<Budget[]>(() => {
        return getInitialBudgets();
    });

    /**
     * Inserts or updates a budget for a category and persists the result.
     * If the category already has a budget, it is replaced with the new limit.
     *
     * @param categoryId Category identifier to set a budget for.
     * @param limit Spending limit in CZK.
     */
    const setBudget = (categoryId: string, limit: number) => {
        setBudgets((prev: Budget[]) => {
            const exists = prev.some(b => b.categoryId === categoryId);

            let newBudgets: Budget[];

            if (exists) {
                newBudgets = prev.map(b => 
                    b.categoryId === categoryId ? { categoryId, limit } : b
                );
            } else {
                newBudgets = [...prev, { categoryId, limit }];
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newBudgets));
            return newBudgets;
        });
    }

    /**
     * Removes a budget by category id and persists the result.
     *
     * @param id Identifier of the category whose budget should be removed.
     */
    const removeBudget = (id: string) => {
        setBudgets((prev: Budget[]) => {
            const delBudget = prev.find(b => b.categoryId === id);
            if (!delBudget) return prev;

            const newBudgets = prev
                .filter(b => b.categoryId !== id) /// vyhodi smazanuo

            localStorage.setItem(STORAGE_KEY, JSON.stringify(newBudgets));
            return newBudgets;
        })
    };

    return { budgets, setBudget, removeBudget };
}