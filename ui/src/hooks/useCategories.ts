import { useEffect, useState } from "react";
import type { Category } from "../types/category";
import { cleanupKeywordsForDeletedCategory } from "../utils/userKeywords";

const STORAGE_KEY = "keep-track-categories";

const DEFAULT_CATEGORIES: Category[] = [
    { id: "food", label: "Jídlo a pití", iconName: "LocalCafe", colorClass: "bg-orange-100 text-orange-600" },
    { id: "transport", label: "Doprava", iconName: "DirectionsTransit", colorClass: "bg-blue-100 text-blue-600" },
    { id: "salary", label: "Výplata", iconName: "AttachMoney", colorClass: "bg-green-100 text-green-600" },
    { id: "entertainment", label: "Zábava", iconName: "Movie", colorClass: "bg-purple-100 text-purple-600" },
    { id: "health", label: "Zdraví", iconName: "LocalHospital", colorClass: "bg-red-100 text-red-600" },
    { id: "housing", label: "Bydlení", iconName: "Home", colorClass: "bg-yellow-100 text-yellow-600" }, 
    { id: "coffee", label: "Kavárny", iconName: "LocalCafe", colorClass: "bg-orange-100 text-orange-600", parentId: "food" },
    { id: "groceries", label: "Potraviny", iconName: "ShoppingCart", colorClass: "bg-orange-100 text-orange-600", parentId: "food" },
    { id: "energy", label: "Energie", iconName: "ElectricBolt", colorClass: "bg-yellow-100 text-yellow-600", parentId: "housing" },
    { id: "rent", label: "Nájem", iconName: "Home", colorClass: "bg-yellow-100 text-yellow-600", parentId: "housing" },
    { id: "fuel", label: "Pohonné hmoty", iconName: "LocalGasStation", colorClass: "bg-blue-100 text-blue-600", parentId: "transport" },
    { id: "uncategorized", label: "Nezařazeno", iconName: "QuestionMark", colorClass: "bg-gray-100 text-gray-600" } // TODO: update to use UNCATEGORIZED_ID constant
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
 * Loads the initial category list from localStorage.
 * Falls back to default categories when storage is unavailable, missing, or invalid.
 *
 * @returns Stored categories, or default categories when data cannot be recovered.
 */
function getInitialCategories(): Category[] {
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
}

//! persistence, event-bus, SSoT
function persistCategories(categories: Category[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('categories-updated'));
}

/**
 * Exposes categories with localStorage-backed initialization.
 * If storage is unavailable or invalid, default categories are returned.
 *
 * @returns Category list and a lookup helper by category id.
 * @deprecated This hook is being replaced by a Zustand store for better performance and global state management. Use `useCategoryStore` instead.
 */
export function useCategories() {
    const [categories, setCategories] = useState<Category[]>(getInitialCategories);

    // Listen for updates to categories from other hook instances
    useEffect(() => {
        const handleCategoriesUpdated = () => {
            setCategories(getInitialCategories());
        };
        window.addEventListener('categories-updated', handleCategoriesUpdated);
        return () => window.removeEventListener('categories-updated', handleCategoriesUpdated);
    }, []);

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
        const current = getInitialCategories();

        const categoryToAdd = current.some(c => c.id === newCategory.id)
            ? { ...newCategory, id: crypto.randomUUID() }
            : newCategory;

        const updatedCategories = [...current, categoryToAdd];
        persistCategories(updatedCategories);
        setCategories(updatedCategories);
    };

    /**
     * Replaces a category with the same id and persists the result.
     * If no matching id exists, the list is effectively unchanged.
     *
     * @param updatedCategory Category payload containing the existing id and updated fields.
     */
    const updateCategory = (updatedCategory: Category) => {
        const current = getInitialCategories();
        const updatedCategories = current.map(c =>
            c.id === updatedCategory.id ? updatedCategory : c
        );
        persistCategories(updatedCategories);
        setCategories(updatedCategories);
    };

    /**
     * Removes a category by id and persists the result.
     * Also cleans up any user-learned keywords associated with this category.
     * 
     * @param id Identifier of the category to remove.
     */
    const removeCategory = (id: string) => {
        // Vyčisti user-learned keywords pro tuto kategorii
        cleanupKeywordsForDeletedCategory(id);

        const current = getInitialCategories();
        const delCat = current.find(c => c.id === id);
        if (!delCat) return; // kategorie nenalezena, nic nema smysl mazat

        const updatedCategories = current
            .filter(c => c.id !== id) // vyhodi smazanou
            .map(c => {
                const nextParentId = c.parentId === id ? undefined : c.parentId; // pokud byla kategorie rodičem, nastaví parentId na undefined
                return nextParentId !== c.parentId ? { ...c, parentId: nextParentId } : c; // pokud se meni parentId, vratime novy objekt, jinak stary (optimalizace renderu)
            });

        persistCategories(updatedCategories);
        setCategories(updatedCategories);
    };

    return { categories, getCategoryById, addCategory, updateCategory, removeCategory };
}