import { create } from "zustand";
import type { QuickAddTemplate } from "../types/quickadd";
import { api } from "../utils/api";

interface TemplateState {
  templates: QuickAddTemplate[];
  isLoading: boolean;

  fetchTemplates: () => Promise<void>;

  addTemplate: (
    newTemplate: Omit<QuickAddTemplate, "id" | "userId" | "category">,
  ) => Promise<void>;
  updateTemplate: (
    id: string,
    updatedTemplate: Partial<
      Omit<QuickAddTemplate, "id" | "userId" | "category">
    >,
  ) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  reorderTemplates: (reorderedTemplates: QuickAddTemplate[]) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>()((set) => ({
  templates: [],
  isLoading: false,

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
      // Optionally, you can refetch the templates to ensure the state is consistent
      await useTemplateStore.getState().fetchTemplates();
    }
  },
}));
