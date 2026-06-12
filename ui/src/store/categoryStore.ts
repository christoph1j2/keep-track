import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '../types/category';
import { cleanupKeywordsForDeletedCategory } from '../utils/userKeywords';

const DEFAULT_CATEGORIES: Category[] = [
    { id: "food", label: "Jídlo a pití", iconName: "LocalCafe", colorClass: "bg-orange-100 text-orange-600", order: 1 },
    { id: "transport", label: "Doprava", iconName: "DirectionsTransit", colorClass: "bg-blue-100 text-blue-600", order: 2 },
    { id: "salary", label: "Výplata", iconName: "AttachMoney", colorClass: "bg-green-100 text-green-600", order: 3 },
    { id: "entertainment", label: "Zábava", iconName: "Movie", colorClass: "bg-purple-100 text-purple-600", order: 4 },
    { id: "health", label: "Zdraví", iconName: "LocalHospital", colorClass: "bg-red-100 text-red-600", order: 5 },
    { id: "housing", label: "Bydlení", iconName: "Home", colorClass: "bg-yellow-100 text-yellow-600", order: 6 }, 
    { id: "coffee", label: "Kavárny", iconName: "LocalCafe", colorClass: "bg-orange-100 text-orange-600", parentId: "food", order: 7 },
    { id: "groceries", label: "Potraviny", iconName: "ShoppingCart", colorClass: "bg-orange-100 text-orange-600", parentId: "food", order: 8 },
    { id: "energy", label: "Energie", iconName: "ElectricBolt", colorClass: "bg-yellow-100 text-yellow-600", parentId: "housing", order: 9 },
    { id: "rent", label: "Nájem", iconName: "Home", colorClass: "bg-yellow-100 text-yellow-600", parentId: "housing", order: 10 },
    { id: "fuel", label: "Pohonné hmoty", iconName: "LocalGasStation", colorClass: "bg-blue-100 text-blue-600", parentId: "transport", order: 11 },
    { id: "uncategorized", label: "Nezařazeno", iconName: "QuestionMark", colorClass: "bg-gray-100 text-gray-600", order: 999999999 }
];

interface CategoryState {
    categories: Category[];
    addCategory: (newCategory: Omit<Category, 'id'>) => void;
    updateCategory: (updatedCategory: Category) => void;
    removeCategory: (id: string) => void;
    moveCategoryUp: (categoryId: string) => void;
    moveCategoryDown: (categoryId: string) => void;
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
                    const delCat = state.categories.find(c => c.id === id);
                    if (!delCat) return state;

                    const updatedCategories = state.categories
                        .filter(c => c.id !== id)
                        .map(c => {
                            const nextParentId = c.parentId === id ? undefined : c.parentId;
                            if (c.order > delCat.order) {
                                return { ...c, parentId: nextParentId, order: c.order - 1 };
                            }
                            return nextParentId !== c.parentId ? { ...c, parentId: nextParentId } : c;
                        });

                    return { categories: updatedCategories };
                });
            },

            moveCategoryUp: (categoryId) => 
                set((state) => {
                    const selectedCat = state.categories.find(c => c.id === categoryId);
                    if (!selectedCat) return state;

                    const previousCat = state.categories.find(c => c.order === selectedCat.order - 1);
                    if (!previousCat) return state;

                    return {
                        categories: state.categories.map(c => {
                            if (c.id === categoryId) return { ...c, order: previousCat.order };
                            if (c.id === previousCat.id) return { ...c, order: selectedCat.order };
                            return c;
                        })
                    };
                }),

            moveCategoryDown: (categoryId) => 
                set((state) => {
                    const selectedCat = state.categories.find(c => c.id === categoryId);
                    if (!selectedCat) return state;

                    const nextCat = state.categories.find(c => c.order === selectedCat.order + 1);
                    if (!nextCat) return state;

                    return {
                        categories: state.categories.map(c => {
                            if (c.id === categoryId) return { ...c, order: nextCat.order };
                            if (c.id === nextCat.id) return { ...c, order: selectedCat.order };
                            return c;
                        })
                    };
                }),
        }),
        {
            name: 'keep-track-categories',
        }
    )
);