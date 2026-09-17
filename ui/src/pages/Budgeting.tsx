import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BaseModal } from "../components/Modals/BaseModal";
import { AddBudgetWizardModal } from "../components/Modals/AddBudgetWizardModal";
import { EditBudgetModal } from "../components/Modals/EditBudgetModal";
import { SortableBudgetItem } from "../components/Budgeting/SortableBudgetItem";
import { useTransactionStore } from "../store/transactionStore";
import { useCategoryStore } from "../store/categoryStore";
import { useBudgetStore } from "../store/budgetStore";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Skeleton } from "@mui/material";

import { ComplexBudget } from "../components/Budgeting/ComplexBudget";

/**
 * Budgeting page for managing monthly spending limits.
 * Displays progress bars for each budget category with drag-and-drop reordering support.
 */
export function Budgeting() {
  const { transactions, isLoading: isTxLoading } = useTransactionStore();
  const { categories, isLoading: isCategoryLoading } = useCategoryStore();
  const {
    budgets,
    complexBudget,
    removeBudget,
    reorderBudgets,
    isLoading: isBudgetLoading,
  } = useBudgetStore();
  const isLoading = isTxLoading || isBudgetLoading || isCategoryLoading;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedBudget, setSelectedBudget] = useState<(typeof budgets)[0]>();
  const [isAddBudgetModalOpen, setAddBudgetModalOpen] = useState(false);
  const [isEditBudgetModalOpen, setEditBudgetModalOpen] = useState(false);

  /**
   * Navigates to the overview page pre-filtered by the clicked category.
   */
  const handleProgressBarClick = (categoryId: string) => {
    navigate("/overview", { state: { selectedCategoryId: categoryId } });
  };

  /**
   * Handles reordering of budget cards via drag-and-drop.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = budgets.findIndex((b) => b.categoryId === active.id);
    const newIndex = budgets.findIndex((b) => b.categoryId === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    reorderBudgets(arrayMove(budgets, oldIndex, newIndex));
  };

  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });

  return (
    <>
      <div className="h-full flex flex-col gap-4">
        <div className="mb-6 flex flex-col items-center text-center md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            {t("budgeting.title")}
          </h2>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full md:w-fit"
            onClick={() => setAddBudgetModalOpen(true)}
          >
            {t("budgeting.addButton")}
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton
                key={idx}
                variant="rectangular"
                height={72}
                className="rounded-xl bg-slate-200! dark:bg-slate-800/80!"
              />
            ))}
          </div>
        ) : budgets.length === 0 && !complexBudget ? (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">{t("budgeting.emptyMessage")}</p>
            <p className="text-sm">{t("budgeting.emptySubMessage")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {complexBudget && <ComplexBudget />}
            {budgets.length > 0 && (
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {t("budgeting.budgetsTitleCustom")}
              </h3>
            )}
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={budgets.map((b) => b.categoryId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3">
                  {budgets.map((budget) => {
                    const category = categories.find(
                      (c) => c.id === budget.categoryId,
                    );
                    if (!category) return null;

                    // Include subcategory transactions since a category budget naturally governs all of its child categories
                    const subcatIds = categories
                      .filter((c) => c.parentId === budget.categoryId)
                      .map((c) => c.id);

                    const categoryTransactions =
                      currentMonthTransactions.filter(
                        (t) =>
                          t.categoryId === budget.categoryId ||
                          subcatIds.includes(t.categoryId || ""),
                      );

                    /**
                     * NOTE:
                     * Budgets serve to monitor and cap spending/expenses.
                     * Only negative transactions (expenses) count toward the spent limit,
                     * converted to absolute values for the progress bar.
                     *
                     * Example:
                     * A user sets a 2,500 CZK spending cap on Food. The budget tracks spending so
                     * they do not exceed that threshold. If they spend 500 CZK at a diner, the
                     * progress bar advances by 500 CZK. If they receive a 700 CZK refund or scholarship,
                     * it does not reduce the expense progress bar since it is income.
                     */
                    const totalSpent = categoryTransactions
                      .filter((t) => t.amount < 0)
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

                    return (
                      <SortableBudgetItem
                        key={budget.categoryId}
                        budget={budget}
                        spent={totalSpent}
                        onProgressBarClick={handleProgressBarClick}
                        onEdit={() => {
                          setSelectedBudget(budget);
                          setEditBudgetModalOpen(true);
                        }}
                        onDelete={() => {
                          removeBudget(budget.id);
                          toast.success(t("budgeting.deleted"));
                        }}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <BaseModal
        title={t("budgeting.modalTitleAdd")}
        isOpen={isAddBudgetModalOpen}
        onClose={() => setAddBudgetModalOpen(false)}
      >
        <AddBudgetWizardModal onCancel={() => setAddBudgetModalOpen(false)} />
      </BaseModal>

      <BaseModal
        title={t("budgeting.modalTitleEdit")}
        isOpen={isEditBudgetModalOpen}
        onClose={() => setEditBudgetModalOpen(false)}
      >
        {selectedBudget && (
          <EditBudgetModal
            key={`${selectedBudget.categoryId}:${selectedBudget.limit}`}
            budget={selectedBudget}
            onCancel={() => setEditBudgetModalOpen(false)}
          />
        )}
      </BaseModal>
    </>
  );
}
