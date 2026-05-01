import { useState } from "react";
import type { Category } from "../types/category";

const STORAGE_KEY = "keep-track-categories";

const DEFAULT_CATEGORIES: Category[] = [
    { id: "food", label: "Jídlo a pití", iconName: "LocalCafe", colorClass: "bg-orange-100 text-orange-600" },
    { id: "transport", label: "Doprava", iconName: "DirectionsTransit", colorClass: "bg-blue-100 text-blue-600" },
    { id: "salary", label: "Výplata", iconName: "AttachMoney", colorClass: "bg-green-100 text-green-600" },
    { id: "entertainment", label: "Zábava", iconName: "Movie", colorClass: "bg-purple-100 text-purple-600" },
];

export function useCategories() {
    const [categories] = useState<Category[]>(() => {
        if (typeof window === "undefined") return DEFAULT_CATEGORIES;
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (!savedData) return DEFAULT_CATEGORIES;
            const parsed: unknown = JSON.parse(savedData);
            return Array.isArray(parsed) ? (parsed as Category[]) : DEFAULT_CATEGORIES;
        } catch (error) {
            console.error("Error parsing saved categories:", error);
            return DEFAULT_CATEGORIES;
        }
    });

    const getCategoryById = (id: string): Category | undefined => {
        return categories.find(cat => cat.id === id) || categories[0];
    };

    return { categories, getCategoryById };
}