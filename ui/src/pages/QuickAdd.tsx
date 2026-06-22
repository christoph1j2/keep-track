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

// maximalni pocet polozek v hotbaru
const HOTBAR_LIMIT = 6;

/**
 * Quick add templates management page for creating transaction shortcuts.
 * Supports creation, editing, deletion, and drag-and-drop reordering of templates.
 * Templates can be toggled for hotbar display with a limit of 6 visible templates.
 */
export function QuickAdd() {
  // nacti vsechny funkce pro praci s templates z hooku
  const { templates, updateTemplate, deleteTemplate, reorderTemplates } =
    useTemplateStore();
  // stav pro otevreni/zavreni modalu
  const [isModalOpen, setIsModalOpen] = useState(false);
  // stav pro uchovani sablony, kterou chceme editovat (null = vytvoreni nove sablony)
  const [editingTemplate, setEditingTemplate] =
    useState<QuickAddTemplate | null>(null);

  const { t } = useTranslation();
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  // filtruj jen ty, ktere maji showInHotbar = true
  // useMemo zajisti, ze se tento vypocet provede jen pri zmene templates, ne pri kazdem renderu
  const hotbarTemplates = useMemo(
    () => templates.filter((template) => template.showInHotbar),
    [templates],
  );

  // funkce pro zpracovani konce drag&drop akce
  const handleDragEnd = (event: DragEndEvent, scope: "all" | "hotbar") => {
    const { active, over } = event;

    // pokud neni nad cimkoliv presunuto, nebo se presouva nad sebou samym, nedelame nic
    if (!over || active.id === over.id) {
      return;
    }

    // pokud se presouva v ramci vsech sablon
    if (scope === "all") {
      // najdi index
      const oldIndex = templates.findIndex((t) => t.id === active.id);
      const newIndex = templates.findIndex((t) => t.id === over.id);

      // over ze oba indexy jsou valid
      if (oldIndex === -1 || newIndex === -1) return;

      // presun prvek a uloz nove poradi
      reorderTemplates(arrayMove(templates, oldIndex, newIndex));
      return;
    }

    // pokud se presouva v ramci hotbaru
    // najdi index
    const oldHotbarIndex = hotbarTemplates.findIndex((t) => t.id === active.id);
    const newHotbarIndex = hotbarTemplates.findIndex((t) => t.id === over.id);

    // over ze oba indexy jsou valid
    if (oldHotbarIndex === -1 || newHotbarIndex === -1) return;

    // presun sablony jen v hotbaru
    const reorderedHotbar = arrayMove(
      hotbarTemplates,
      oldHotbarIndex,
      newHotbarIndex,
    );
    // vytvor kopii noveho poradi hotbaru
    const hotbarQueue = [...reorderedHotbar];
    // projdi vsechny sablony a namichej nove poradi
    reorderTemplates(
      templates.map((template) =>
        template.showInHotbar ? (hotbarQueue.shift() ?? template) : template,
      ),
    );
  };

  const handleCreateClick = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (template: QuickAddTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (template: QuickAddTemplate) => {
    showConfirm(
      t("common.warning"),
      t("quickAdd.confirmDelete", { title: template.title }),
      () => {
        deleteTemplate(template.id);
        toast.success(t("quickAdd.deleted"));
      },
    );
  };

  const handleToggleHotbar = (template: QuickAddTemplate) => {
    // nesmi byt vice sablon v hotbaru nez je limit
    if (!template.showInHotbar && hotbarTemplates.length >= HOTBAR_LIMIT) {
      showConfirm(
        t("common.warning"),
        t("quickAdd.hotbarLimitReached", { limit: HOTBAR_LIMIT }),
        () => {},
      );
      return;
    }
    // jinak prepni showInHotbar a uloz zmenu
    updateTemplate({ ...template, showInHotbar: !template.showInHotbar });
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
