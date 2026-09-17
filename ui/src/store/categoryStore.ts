import { create } from "zustand";
import type { Category } from "../types/category";
import { api } from "../utils/api";

/**
 * CategoryState interface defines the structure of the category state managed by the category store.
 */
interface CategoryState {
  categories: Category[];
  isLoading: boolean;

  /**
   * Fetches the list of categories from the API and updates the state.
   */
  fetchCategories: () => Promise<void>;

  /**
   * Adds a new category by sending a POST request to the API.
   *
   * @param categoryData - Category payload (label, color, icon, parentId, etc.) excluding server-assigned id and userId.
   */
  addCategory: (categoryData: Omit<Category, "id" | "userId">) => Promise<void>;

  /**
   * Updates an existing category by sending a PATCH request to the API.
   *
   * @param updatedCategory - Updated category details including its id.
   */
  updateCategory: (updatedCategory: Omit<Category, "userId">) => Promise<void>;

  /**
   * Removes a category by sending a DELETE request to the API, removing it from state,
   * and resetting the parentId of any of its child categories to null.
   *
   * @param id - The unique identifier of the category to delete.
   */
  removeCategory: (id: string) => Promise<void>;

  /**
   * Optimistically reorders the categories in local state and persists the new order to the API.
   *
   * @param newCategories - The reordered list of categories to apply and persist.
   */
  reorderCategories: (newCategories: Category[]) => Promise<void>;
}

/**
 * Custom hook for managing the category state.
 */
export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  isLoading: true,

  /**
   * Fetches the list of categories from the API and updates the state accordingly.
   */
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

  /**
   * Adds a new category by sending a POST request to the API and updating the state with the new category.
   *
   * @param categoryData - New category attributes without id and userId.
   */
  addCategory: async (categoryData) => {
    const response = await api.post("/categories", categoryData);
    set((state) => ({
      categories: [...state.categories, response.data],
    }));
  },

  /**
   * Updates an existing category by sending a PATCH request to the API and updating the state with the modified category.
   *
   * @param updatedCategory - Updated category details including its ID.
   */
  updateCategory: async (updatedCategory) => {
    const { id, ...data } = updatedCategory;
    const response = await api.patch(`/categories/${id}`, data);
    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === id ? response.data : cat,
      ),
    }));
  },

  /**
   * Removes a category by sending a DELETE request to the API and updating the state by filtering out
   * the removed category and un-nesting any child categories.
   *
   * @param id - The ID of the category to delete.
   */
  removeCategory: async (id) => {
    await api.delete(`/categories/${id}`);

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

  /**
   * Reorders the categories by sending a PATCH request to the API with the new order and updating the state accordingly.
   * Refetches categories from the server if the reorder request fails.
   *
   * @param reorderedCategories - The reordered category list to persist.
   */
  reorderCategories: async (reorderedCategories) => {
    set({ categories: reorderedCategories });

    const payload = reorderedCategories.map((cat, index) => ({
      id: cat.id,
      order: index,
    }));

    try {
      await api.patch("/categories/reorder", { categories: payload });
    } catch (error) {
      console.error("Error reordering categories:", error);
      // Refetch categories to ensure the state is consistent
      await useCategoryStore.getState().fetchCategories();
    }
  },
}));
