import { useState } from "react";
import type { Category } from "../types/category";

const STORAGE_KEY = "keep-track-categories";

const DEFAULT_CATEGORIES: Category[] = [
    { id: "food", label: "Jídlo a pití", iconName: "LocalCafe", colorClass: "bg-orange-100 text-orange-600", order: 1 },
    { id: "transport", label: "Doprava", iconName: "DirectionsTransit", colorClass: "bg-blue-100 text-blue-600", order: 2 },
    { id: "salary", label: "Výplata", iconName: "AttachMoney", colorClass: "bg-green-100 text-green-600", order: 3 },
    { id: "entertainment", label: "Zábava", iconName: "Movie", colorClass: "bg-purple-100 text-purple-600", order: 4 },
    { id: "health", label: "Zdraví", iconName: "LocalHospital", colorClass: "bg-red-100 text-red-600", order: 5 },
    { id: "coffee", label: "Kavárny", iconName: "LocalCafe", colorClass: "bg-orange-100 text-orange-600", parentId: "food", order: 6 },
    { id: "groceries", label: "Potraviny", iconName: "ShoppingCart", colorClass: "bg-orange-100 text-orange-600", parentId: "food", order: 7 },
    { id: "energy", label: "Energie", iconName: "ElectricBolt", colorClass: "bg-yellow-100 text-yellow-600", parentId: "housing", order: 8 },
    { id: "rent", label: "Nájem", iconName: "Home", colorClass: "bg-yellow-100 text-yellow-600", parentId: "housing", order: 9 },
    { id: "fuel", label: "Pohonné hmoty", iconName: "LocalGasStation", colorClass: "bg-blue-100 text-blue-600", parentId: "transport", order: 10 },
    { id: "uncategorized", label: "Nezařazeno", iconName: "QuestionMark", colorClass: "bg-gray-100 text-gray-600", order: 999999999 }
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
        typeof v.iconName !== "string" || typeof v.colorClass !== "string"
        || typeof v.order !== "number") {
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
    const [categories, setCategories] = useState<Category[]>(() => {
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

    /**
     * Inserts a new category.
     * 
     * @param newCategory New category record to store.
     */
    const addCategory = (newCategory: Category) => {
        setCategories((prev: Category[]) => {
            const updatedCategories = [...prev, newCategory];
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
            } catch (error) {
                console.error("Error saving categories:", error);
            }
            return updatedCategories;
        })
    };

    /**
     * Replaces a category with the same id and persists the result.
     * If no matching id exists, the list is effectively unchanged.
     *
     * @param updatedCategory Category payload containing the existing id and updated fields.
     */
    const updateCategory = (updatedCategory: Category) => {
        setCategories((prev: Category[]) => {
            const newCategories = prev.map(c => 
                c.id === updatedCategory.id ? updatedCategory : c
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
            return newCategories;
        })
    };

    /**
     * Removes a category by id and persists the result.
     * 
     * @param id Identifier of the category to remove.
     */
    const removeCategory = (id: string) => {
        setCategories((prev: Category[]) => {
            const delCat = prev.find(c => c.id === id);
            if (!delCat) return prev; // kategorie nenalezena, nic nema smysl mazat
            
            const newCategories = prev
                .filter(c => c.id !== id) // vyhodi smazanou
                .map(c => {
                    if (c.order > delCat.order) {
                        return { ...c, order: c.order - 1 }; // posuneme nahoru kategorie, ktere byly pod mazanym
                    }
                    return c;
                });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
            return newCategories;
        })
    };

    // TODO FIX, DOESNT SAVE TO LOCALSTORAGE CORRECTLY

    const moveCategoryUp = (categoryId: string) => {
        setCategories((prev: Category[]) => {
            const selectedCat = prev.find(c => c.id === categoryId);
            let selectedCatOrder = selectedCat?.order || 0;
            const previousCat = prev.find(c => c.order === (selectedCatOrder) - 1);
            let previousCatOrder = previousCat?.order || 0;

            if (!selectedCat || !previousCat) {
                return prev; // nelze posunout
            }

            const tmp = selectedCatOrder;
            selectedCatOrder = previousCatOrder;
            previousCatOrder = tmp;

            const newCategories = prev.map(c => {
                if (c.id === categoryId) {
                    return { ...c, order: selectedCatOrder };
                }
                if (c.id === previousCat.id) {
                    return { ...c, order: previousCatOrder };
                }
                return c;
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
            return newCategories;
        })
    };

    const moveCategoryDown = (categoryId: string) => {
        setCategories((prev: Category[]) => {
            const selectedCat = prev.find(c => c.id === categoryId);
            let selectedCatOrder = selectedCat?.order || 0;
            const nextCat = prev.find(c => c.order === selectedCatOrder + 1);
            let nextCatOrder = nextCat?.order || 0;

            if (!selectedCat || !nextCat) {
                return prev; // nelze posunout
            }

            const tmp = selectedCatOrder;
            selectedCatOrder = nextCatOrder;
            nextCatOrder = tmp;

            const newCategories = prev.map(c => {
                if (c.id === categoryId) {
                    return { ...c, order: selectedCatOrder };
                }
                if (c.id === nextCat?.id) {
                    return { ...c, order: nextCatOrder };
                }
                return c;
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
            return newCategories;
        })
    };

    return { categories, getCategoryById, addCategory, updateCategory, removeCategory, moveCategoryUp, moveCategoryDown };
}