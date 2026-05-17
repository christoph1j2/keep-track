import { useState } from "react";
import type { Budget } from "../types/budget";

const STORAGE_KEY = "keep-track-budgets";

function isBudget(obj: unknown): obj is Budget {
    if (!obj || typeof obj !== "object") return false;
    const b = obj as Record<string, unknown>;
    return typeof b.categoryId === "string" && typeof b.limit === "number";
}

export function useBudgets() {
    const [budgets, setBudgets] = useState<Budget[]>(() => {
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
    });

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