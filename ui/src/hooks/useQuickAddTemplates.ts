import { useState } from "react";
import type { QuickAddTemplate } from "../types/quickadd";

const STORAGE_KEY = "keep-track-quick-add-templates";


function isQuickAddTemplate(value: unknown): value is Omit<QuickAddTemplate, "showInHotbar"> & { showInHotbar?: boolean } {  
    if (!value || typeof value !== "object") return false;  
    const t = value as Record<string, unknown>;  
    const hotbarOk = t.showInHotbar === undefined || typeof t.showInHotbar === "boolean";  
    return (  
        typeof t.id === "string" &&  
        typeof t.title === "string" &&  
        typeof t.amount === "number" &&  
        typeof t.categoryId === "string" &&  
        hotbarOk  
    );  
}  
 

/**
 * Loads the initial quick add template list from localStorage.
 * Falls back to an empty list when storage is unavailable, missing, or invalid.
 * Ensures showInHotbar defaults to true when not provided.
 *
 * @returns Stored templates, or an empty array when data cannot be recovered.
 */
function getInitialTemplates(): QuickAddTemplate[] {
    if (typeof window === "undefined") return [];
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return [];
        const parsed: unknown = JSON.parse(savedData);
        return Array.isArray(parsed)
            ? parsed
                .filter(isQuickAddTemplate)
                .map((template) => ({
                ...template,
                showInHotbar: template.showInHotbar ?? true,
            }))
            : [];
    } catch (error) {
        console.error("Error parsing saved quick add templates:", error);
        return [];
    }
}

/**
 * Keeps quick add template state in sync with localStorage.
 * Quick add templates are pre-configured shortcuts for fast transaction creation.
 *
 * @returns Current templates and mutation helpers for add, update, delete, and reorder actions.
 */
export function useQuickAddTemplates() {
    const [templates, setTemplates] = useState<QuickAddTemplate[]>(getInitialTemplates);

    /**
     * Inserts a new template at the top of the list and persists the updated list.
     *
     * @param newTemplate New template record to store.
     */
    const addTemplate = (newTemplate: QuickAddTemplate) => {
        setTemplates((prev: QuickAddTemplate[]) => {
            const updatedTemplates = [newTemplate, ...prev];
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
            } catch (error) {
                console.error("Error saving quick add templates:", error);
            }
            return updatedTemplates;
        })
    };

    /**
     * Replaces a template with the same id and persists the result.
     * If no matching id exists, the list is effectively unchanged.
     *
     * @param updatedTemplate Template payload containing the existing id and updated fields.
     */
    const updateTemplate = (updatedTemplate: QuickAddTemplate) => {
        setTemplates((prev: QuickAddTemplate[]) => {
            const newTemplates = prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
            return newTemplates;
        });
    };

    /**
     * Removes a template by id and persists the result.
     *
     * @param id Identifier of the template to remove.
     */
    const deleteTemplate = (id: string) => {
        setTemplates((prev: QuickAddTemplate[]) => {
            const newTemplates = prev.filter(t => t.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
            return newTemplates;
        });
    };

    /**
     * Replaces the template list with a new order and persists the result.
     * Used for drag-and-drop reordering in the UI.
     *
     * @param reorderedTemplates Reordered list of templates.
     */
    const reorderTemplates = (reorderedTemplates: QuickAddTemplate[]) => {
        setTemplates(reorderedTemplates);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reorderedTemplates));
    };

    return { templates, addTemplate, updateTemplate, deleteTemplate, reorderTemplates };
}
