import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '../types/category';
import { cleanupKeywordsForDeletedCategory } from '../utils/userKeywords';

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
    { id: "uncategorized", label: "Nezařazeno", iconName: "QuestionMark", colorClass: "bg-gray-100 text-gray-600" }
];

interface CategoryState {
    categories: Category[];
    addCategory: (newCategory: Omit<Category, 'id'>) => void;
    updateCategory: (updatedCategory: Category) => void;
    removeCategory: (id: string) => void;
    reorderCategories: (newCategories: Category[]) => void;
}

export const useCategoryStore = create<CategoryState>()(
    persist(
        (set) => ({
            // Výchozí stav se nastaví automaticky, pokud v localStorage nic není
            categories: DEFAULT_CATEGORIES,

            addCategory: (categoryData) => {
                set((state) => {
                    const newCategory: Category = {
                        ...categoryData,
                        id: crypto.randomUUID(),
                    };
                    return { categories: [...state.categories, newCategory] };
                })
            },
            updateCategory: (updatedCategory) => 
                set((state) => ({
                    categories: state.categories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
                })),

            removeCategory: (id) => {
                // 1. Externí side-effect před změnou stavu
                cleanupKeywordsForDeletedCategory(id);

                // 2. Úprava samotného stavu
                set((state) => {
                    const updatedCategories = state.categories
                        .filter(c => c.id !== id)
                        .map(c => {
                            const nextParentId = c.parentId === id ? undefined : c.parentId;
                            return nextParentId !== c.parentId ? { ...c, parentId: nextParentId } : c;
                        });

                    return { categories: updatedCategories };
                });
            },

            reorderCategories: (newCategories) =>
                set(() => ({ categories: newCategories })),
        }),
        {
            name: 'keep-track-categories',
        }
    )
);