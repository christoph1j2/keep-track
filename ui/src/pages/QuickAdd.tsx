import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Add } from "@mui/icons-material";
import { useMemo, useState } from "react";
import { SortableTemplateItem } from "../components/QuickAdd/SortableTemplateItem";
import { type QuickAddTemplate } from "../types/quickadd";
import { BaseModal } from "../components/Modals/BaseModal";
import { QuickAddTemplateModal } from "../components/Modals/QuickAddTemplateModal";
import { useTemplateStore } from "../store/quickAddTemplateStore";
import { useConfirmStore } from "../store/confirmStore";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

// Maximum number of items allowed in the hotbar
const HOTBAR_LIMIT = 6;

/**
 * Quick add templates management page for creating transaction shortcuts.
 * Supports creation, editing, deletion, and drag-and-drop reordering of templates.
 * Templates can be toggled for hotbar display with a limit of 6 visible templates.
 */
export function QuickAdd() {
  // Store actions and template list
  const { templates, updateTemplate, deleteTemplate, reorderTemplates } =
    useTemplateStore();

  // State to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Template currently selected for editing (null represents creating a new template)
  const [editingTemplate, setEditingTemplate] =
    useState<QuickAddTemplate | null>(null);

  const { t } = useTranslation();
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  /**
   * Filter only templates flagged with showInHotbar = true.
   * Memoized to avoid unnecessary recalculations during re-renders.
   */
  const hotbarTemplates = useMemo(
    () => templates.filter((template) => template.showInHotbar),
    [templates],
  );

  /**
   * Handles the end of a drag-and-drop action.
   * Reorders items either globally or within hotbar-only items.
   *
   * @param event - The dnd-kit DragEndEvent containing source and destination IDs
   * @param scope - Scope of reordering: "all" for general list or "hotbar" for hotbar buttons
   */
  const handleDragEnd = (event: DragEndEvent, scope: "all" | "hotbar") => {
    const { active, over } = event;

    // If dropped outside a valid droppable or over itself, do nothing
    if (!over || active.id === over.id) {
      return;
    }

    // Reordering within the full template list
    if (scope === "all") {
      const oldIndex = templates.findIndex((t) => t.id === active.id);
      const newIndex = templates.findIndex((t) => t.id === over.id);

      // Verify both indices exist
      if (oldIndex === -1 || newIndex === -1) return;

      // Move element and persist the new order
      reorderTemplates(arrayMove(templates, oldIndex, newIndex));
      return;
    }

    // Reordering exclusively within hotbar items
    const oldHotbarIndex = hotbarTemplates.findIndex((t) => t.id === active.id);
    const newHotbarIndex = hotbarTemplates.findIndex((t) => t.id === over.id);

    // Verify both indices exist
    if (oldHotbarIndex === -1 || newHotbarIndex === -1) return;

    // Move templates inside the hotbar array
    const reorderedHotbar = arrayMove(
      hotbarTemplates,
      oldHotbarIndex,
      newHotbarIndex,
    );
    // Create a queue copy of the reordered hotbar
    const hotbarQueue = [...reorderedHotbar];
    // Traverse all templates and inject the newly ordered hotbar elements in place
    reorderTemplates(
      templates.map((template) =>
        template.showInHotbar ? (hotbarQueue.shift() ?? template) : template,
      ),
    );
  };

  /**
   * Opens modal to create a brand new quick-add template.
   */
  const handleCreateClick = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  /**
   * Opens modal configured to edit an existing quick-add template.
   */
  const handleEditClick = (template: QuickAddTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  /**
   * Prompts user for confirmation before permanently deleting a template.
   */
  const handleDeleteClick = (template: QuickAddTemplate) => {
    showConfirm(
      t("common.warning"),
      t("quickAdd.confirmDelete", { title: template.title }),
      async () => {
        try {
          await deleteTemplate(template.id);
          toast.success(t("quickAdd.deleted"));
        } catch (err) {
          console.error("Error deleting template:", err);
          toast.error(t("common.error"));
        }
      },
    );
  };

  /**
   * Toggles whether a template appears on the hotbar, enforcing the limit.
   */
  const handleToggleHotbar = async (template: QuickAddTemplate) => {
    // Prevent exceeding maximum hotbar slots
    if (!template.showInHotbar && hotbarTemplates.length >= HOTBAR_LIMIT) {
      showConfirm(
        t("common.warning"),
        t("quickAdd.hotbarLimitReached", { limit: HOTBAR_LIMIT }),
        () => {},
      );
      return;
    }
    // Otherwise toggle showInHotbar and persist
    try {
      await updateTemplate(template.id, {
        ...template,
        showInHotbar: !template.showInHotbar,
      });
    } catch (err) {
      console.error("Error toggling hotbar:", err);
    }
  };

  return (
    <div className="p-2 h-full flex flex-col gap-6">
      <div className="flex flex-col items-center text-center md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
          {t("quickAdd.title")}
        </h2>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors w-full md:w-fit"
          onClick={handleCreateClick}
        >
          <Add fontSize="small" />
          {t("quickAdd.addNew")}
        </button>
      </div>

      <section className="bg-white dark:bg-slate-900 dark:border-slate-600 p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            {t("quickAdd.hotbarTitle")}
          </h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t("quickAdd.hotbarActive", {
              current: hotbarTemplates.length,
              limit: HOTBAR_LIMIT,
            })}
          </span>
        </div>

        {hotbarTemplates.length > 0 ? (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, "hotbar")}
          >
            <SortableContext
              items={hotbarTemplates.map((template) => template.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-4 overflow-x-auto pb-2">
                {hotbarTemplates.map((template: QuickAddTemplate) => (
                  <SortableTemplateItem
                    key={template.id}
                    template={template}
                    compact
                    onEdit={handleEditClick}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-slate-500">
            {t("quickAdd.hotbarEmpty")}
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-slate-900 dark:border-slate-600 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-600">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            {t("quickAdd.stackTitle")}
          </h3>
        </div>

        {templates.length > 0 ? (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, "all")}
          >
            <SortableContext
              items={templates.map((template) => template.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-600">
                {templates.map((template: QuickAddTemplate) => (
                  <SortableTemplateItem
                    key={template.id}
                    template={template}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onToggleHotbar={handleToggleHotbar}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="p-8 text-center text-slate-500">
            {t("quickAdd.stackEmpty")}
          </div>
        )}
      </section>

      <BaseModal
        title={
          editingTemplate
            ? t("quickAdd.modalTitleEdit")
            : t("quickAdd.modalTitleAdd")
        }
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <QuickAddTemplateModal
          template={editingTemplate}
          onCancel={() => setIsModalOpen(false)}
        />
      </BaseModal>
    </div>
  );
}
