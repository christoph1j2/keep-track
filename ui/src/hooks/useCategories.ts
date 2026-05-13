import { useState } from "react";
import type { Category } from "../types/category";

const STORAGE_KEY = "keep-track-categories";

const DEFAULT_CATEGORIES: Category[] = [
    { id: "food", label: "Jídlo a pití", iconName: "LocalCafe", colorClass: "bg-orange-100 text-orange-600" },
    { id: "transport", label: "Doprava", iconName: "DirectionsTransit", colorClass: "bg-blue-100 text-blue-600" },
    { id: "salary", label: "Výplata", iconName: "AttachMoney", colorClass: "bg-green-100 text-green-600" },
    { id: "entertainment", label: "Zábava", iconName: "Movie", colorClass: "bg-purple-100 text-purple-600" },
    { id: "health", label: "Zdraví", iconName: "LocalHospital", colorClass: "bg-red-100 text-red-600" },

    { id: "coffee", label: "Kavárny", iconName: "LocalCafe", colorClass: "bg-orange-100 text-orange-600", parentId: "food" },
    { id: "groceries", label: "Potraviny", iconName: "ShoppingCart", colorClass: "bg-orange-100 text-orange-600", parentId: "food" },
    { id: "energy", label: "Energie", iconName: "ElectricBolt", colorClass: "bg-yellow-100 text-yellow-600", parentId: "housing" },
    { id: "rent", label: "Nájem", iconName: "Home", colorClass: "bg-yellow-100 text-yellow-600", parentId: "housing" },
    { id: "fuel", label: "Pohonné hmoty", iconName: "LocalGasStation", colorClass: "bg-blue-100 text-blue-600", parentId: "transport" },
];

/**
 * Runtime check used when reading categories from localStorage.
 * Protects the app from malformed or outdated saved data.
 *
 * @param value Value to validate.
 * @returns True when the value matches the Category shape.
 */
function isCategory(value: unknown): value is Category {
    if (!value || typeof value !== "object") {
        return false;
    }
    const v = value as Record<string, unknown>;
    if (typeof v.id !== "string" || typeof v.label !== "string" || 
        typeof v.iconName !== "string" || typeof v.colorClass !== "string") {
        return false;
    }
    return v.parentId === undefined || typeof v.parentId === "string";
}

/**
 * Exposes categories with localStorage-backed initialization.
 * If storage is unavailable or invalid, default categories are returned.
 *
 * @returns Category list and a lookup helper by category id.
 */
export function useCategories() {
    const [categories] = useState<Category[]>(() => {
        if (typeof window === "undefined") return DEFAULT_CATEGORIES;
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (!savedData) return DEFAULT_CATEGORIES;
            const parsed: unknown = JSON.parse(savedData);
            return Array.isArray(parsed) && parsed.every(isCategory)
                ? parsed
                : DEFAULT_CATEGORIES;
        } catch (error) {
            console.error("Error parsing saved categories:", error);
            return DEFAULT_CATEGORIES;
        }
    });

    /**
      * Finds a category by id.
     *
     * @param id Category identifier.
      * @returns Matching category, or undefined when the id is unknown.
     */
    const getCategoryById = (id: string): Category | undefined => {
        return categories.find(cat => cat.id === id);
    };

    return { categories, getCategoryById };
}