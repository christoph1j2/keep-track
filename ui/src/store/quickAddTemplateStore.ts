import { create } from "zustand";
import type { QuickAddTemplate } from "../types/quickadd";
import { api } from "../utils/api";

/**
 * TemplateState interface defines the structure of the quick add template state managed by the template store.
 */
interface TemplateState {
  templates: QuickAddTemplate[];
  isLoading: boolean;

  /**
   * Fetches the list of quick add templates from the API and updates the state.
   */
  fetchTemplates: () => Promise<void>;

  /**
   * Adds a new quick add template by sending a POST request to the API.
   *
   * @param newTemplate - Template attributes (title, amount, categoryId, showInHotbar, etc.) excluding server-generated properties.
   * @throws Re-throws any error encountered during the API call.
   */
  addTemplate: (
    newTemplate: Omit<QuickAddTemplate, "id" | "userId" | "category">,
  ) => Promise<void>;

  /**
   * Updates an existing quick add template by sending a PATCH request to the API.
   *
   * @param id - The unique identifier of the template to update.
   * @param updatedTemplate - The partial template fields to update.
   * @throws Re-throws any error encountered during the API call.
   */
  updateTemplate: (
    id: string,
    updatedTemplate: Partial<
      Omit<QuickAddTemplate, "id" | "userId" | "category">
    >,
  ) => Promise<void>;

  /**
   * Deletes a quick add template by sending a DELETE request to the API.
   *
   * @param id - The unique identifier of the template to delete.
   * @throws Re-throws any error encountered during the API call.
   */
  deleteTemplate: (id: string) => Promise<void>;

  /**
   * Optimistically reorders the quick add templates in local state and persists the new order to the API.
   *
   * @param reorderedTemplates - The reordered list of templates to apply and persist.
   */
  reorderTemplates: (reorderedTemplates: QuickAddTemplate[]) => Promise<void>;
}

/**
 * Custom hook for managing the quick add template state.
 */
export const useTemplateStore = create<TemplateState>()((set) => ({
  templates: [],
  isLoading: true,

  /**
   * Fetches the list of quick add templates from the API and updates the state accordingly.
   */
  fetchTemplates: async () => {
    set({ isLoading: true });

    try {
      const response = await api.get("/templates");
      set({ templates: response.data });
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Adds a new quick add template by sending a POST request to the API and updating the state with the new template.
   *
   * @param newTemplate - New template configuration.
   * @throws Re-throws the API error if creation fails.
   */
  addTemplate: async (newTemplate) => {
    try {
      const dataToSend = {
        ...newTemplate,
        showInHotbar: newTemplate.showInHotbar ?? false,
      };

      const response = await api.post("/templates", dataToSend);
      set((state) => ({
        templates: [response.data, ...state.templates],
      }));
    } catch (err) {
      console.error("Error adding template:", err);
      throw err;
    }
  },

  /**
   * Updates an existing quick add template by sending a PATCH request to the API and updating the state with the modified template.
   *
   * @param id - The ID of the template to update.
   * @param updatedTemplate - Partial attributes to update on the template.
   * @throws Re-throws the API error if updating fails.
   */
  updateTemplate: async (id, updatedTemplate) => {
    try {
      const response = await api.patch(`/templates/${id}`, updatedTemplate);
      set((state) => ({
        templates: state.templates.map((template) =>
          template.id === id ? response.data : template,
        ),
      }));
    } catch (err) {
      console.error("Error updating template:", err);
      throw err;
    }
  },

  /**
   * Deletes a quick add template by sending a DELETE request to the API and updating the state to remove it from the list.
   *
   * @param id - The ID of the template to remove.
   * @throws Re-throws the API error if deletion fails.
   */
  deleteTemplate: async (id) => {
    try {
      await api.delete(`/templates/${id}`);
      set((state) => ({
        templates: state.templates.filter((template) => template.id !== id),
      }));
    } catch (err) {
      console.error("Error deleting template:", err);
      throw err;
    }
  },

  /**
   * Reorders the quick add templates by sending a PATCH request to the API with the new order and updating the state accordingly.
   * Refetches the templates from the server if the request fails.
   *
   * @param reorderedTemplates - The reordered list of templates to persist.
   */
  reorderTemplates: async (reorderedTemplates) => {
    set({ templates: reorderedTemplates });

    const payload = reorderedTemplates.map((template, index) => ({
      id: template.id,
      order: index,
    }));
    try {
      await api.patch("/templates/reorder", { templates: payload });
    } catch (error) {
      console.error("Error reordering templates:", error);
      // Refetch templates to ensure the state is consistent
      await useTemplateStore.getState().fetchTemplates();
    }
  },
}));
