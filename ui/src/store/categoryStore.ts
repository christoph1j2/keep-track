import { create } from "zustand";
import type { Category } from "../types/category";
import { api } from "../utils/api";

interface CategoryState {
  categories: Category[];
  isLoading: boolean;

  fetchCategories: () => Promise<void>;
  addCategory: (categoryData: Omit<Category, "id" | "userId">) => Promise<void>;
  updateCategory: (updatedCategory: Omit<Category, "userId">) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  reorderCategories: (newCategories: Category[]) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get("/categories");
      set({ categories: response.data, isLoading: false });
    } catch (error) {
      console.error("Error fetching categories:", error);
      set({ isLoading: false });
    }
  },

  addCategory: async (categoryData) => {
    const response = await api.post("/categories", categoryData);
    set((state) => ({
      categories: [...state.categories, response.data],
    }));
  },

  updateCategory: async (updatedCategory) => {
    const { id, ...data } = updatedCategory;
    const response = await api.patch(`/categories/${id}`, data);
    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === id ? response.data : cat,
      ),
    }));
  },

  removeCategory: async (id) => {
    await api.delete(`/categories/${id}`);

    // cleanupKeywordsForDeletedCategory(id);

    set((state) => {
      const updatedCategories = state.categories
        .filter((cat) => cat.id !== id)
        .map((cat) => {
          const nextParentId = cat.parentId === id ? null : cat.parentId;
          return nextParentId !== cat.parentId
            ? { ...cat, parentId: nextParentId }
            : cat;
        });

      return { categories: updatedCategories };
    });
  },

  reorderCategories: async (reorderedCategories) => {
    set({ categories: reorderedCategories });

    const payload = reorderedCategories.map((cat, index) => ({
      id: cat.id,
      order: index,
    }));

    try {
      await api.patch("/categories/reorder", payload);
    } catch (error) {
      console.error("Error reordering categories:", error);
      // Optionally, you can refetch the categories to ensure the state is consistent
      await useCategoryStore.getState().fetchCategories();
    }
  },
}));
