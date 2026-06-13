import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuickAddTemplate } from '../types/quickadd';

interface TemplateState {
    templates: QuickAddTemplate[];
    addTemplate: (newTemplate: QuickAddTemplate) => void;
    updateTemplate: (updatedTemplate: QuickAddTemplate) => void;
    deleteTemplate: (id: string) => void;
    reorderTemplates: (reorderedTemplates: QuickAddTemplate[]) => void;
}

export const useTemplateStore = create<TemplateState>()(
    persist(
        (set) => ({
            templates: [],

            addTemplate: (newTemplate) => 
                set((state) => {
                    const templateToAdd = state.templates.some(t => t.id === newTemplate.id)
                        ? { ...newTemplate, id: crypto.randomUUID() }
                        : newTemplate;
                    
                    // Záchrana tvé fallback logiky pro hotbar
                    if (templateToAdd.showInHotbar === undefined) {
                        templateToAdd.showInHotbar = true;
                    }

                    // V původním kódu jsi přidával na začátek pole, držíme to!
                    return { templates: [templateToAdd, ...state.templates] };
                }),

            updateTemplate: (updatedTemplate) => 
                set((state) => ({
                    templates: state.templates.map(t => 
                        t.id === updatedTemplate.id ? updatedTemplate : t
                    )
                })),

            deleteTemplate: (id) => 
                set((state) => ({
                    templates: state.templates.filter(t => t.id !== id)
                })),

            reorderTemplates: (reorderedTemplates) => 
                set({ templates: reorderedTemplates }),
        }),
        {
            name: 'keep-track-quick-add-templates',
        }
    )
);