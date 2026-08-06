import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { ProgressBar } from "../components/Budgeting/ProgressBar";
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
import { EditComplexBudgetModal } from "../components/Modals/EditComplexBudgetModal";
import { SortableBudgetItem } from "../components/Budgeting/SortableBudgetItem";
import { useTransactionStore } from "../store/transactionStore";
import { useCategoryStore } from "../store/categoryStore";
import { useBudgetStore } from "../store/budgetStore";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Skeleton } from "@mui/material";
import { useConfirmStore } from "../store/confirmStore";
import { Delete, Edit } from "@mui/icons-material";

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
    removeComplexBudget,
    reorderBudgets,
    isLoading: isBudgetLoading,
  } = useBudgetStore();
  const isLoading = isTxLoading || isBudgetLoading || isCategoryLoading;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  const [selectedBudget, setSelectedBudget] = useState<(typeof budgets)[0]>();
  const [isAddBudgetModalOpen, setAddBudgetModalOpen] = useState(false);
  const [isEditBudgetModalOpen, setEditBudgetModalOpen] = useState(false);
  const [isEditComplexModalOpen, setEditComplexModalOpen] = useState(false);

  const handleProgressBarClick = (categoryId: string) => {
    navigate("/overview", { state: { selectedCategoryId: categoryId } });
  };

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

  const totalSpentAll = currentMonthTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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
            {complexBudget && (
              <div className="bg-sky-50 dark:bg-sky-900 p-4 rounded-xl border border-sky-100 dark:border-sky-700 relative">
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <button
                    className="text-slate-400 hover:text-blue-500 text-sm"
                    onClick={() => setEditComplexModalOpen(true)}
                  >
                    <Edit fontSize="small" />
                  </button>
                  <button
                    onClick={() => {
                      showConfirm(
                        t("common.warning"),
                        t("budgeting.deleteConfirmComplex"),
                        () => removeComplexBudget(),
                      );
                    }}
                    className="shrink-0 rounded-md px-1 font-semibold text-red-500 dark:text-red-700 dark:hover:bg-slate-600 transition-colors hover:bg-red-50 inline-flex items-center gap-1"
                  >
                    <Delete fontSize="medium" />
                  </button>
                </div>
                <div className="mb-2">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    Komplexní rozpočet
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Příjem: {complexBudget.income} | Nutné výdaje:{" "}
                    {complexBudget.necessaryExpenses}
                  </p>
                </div>
                <ProgressBar
                  categoryName="Celková útrata (mimo nutných výdajů)"
                  progress={totalSpentAll}
                  limit={complexBudget.limit}
                />
                {}
              </div>
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

                    //! zahrneme i transakce z podkategorií (logicky by měly být zahrnuty, protože rozpočet se vztahuje na celou kategorii včetně podkategorií)
                    const subcatIds = categories
                      .filter((c) => c.parentId === budget.categoryId)
                      .map((c) => c.id);

                    const categoryTransactions =
                      currentMonthTransactions.filter(
                        (t) =>
                          t.categoryId === budget.categoryId ||
                          subcatIds.includes(t.categoryId || ""),
                      );

                    /** NOTE:
                     * Rozpočty slouží k hlídání a omezování útrat/výdajů
                     * => do vyčerpaného limitu se počítají tedy pouze záporné transakce, ze kterých se počítá abs pro progress bar
                     *
                     * Příklad:
                     * Jsem student, nastavím si rozpočet 2500 Kč na jídlo. Rozpočty hlídají, abych nepřekročil stanovený limit v rámci útraty v té dané kategorii. Pokud utratím 500 v pizzerii, progress bar vzroste o 500, atp. Pokud ale dostanu stipendium 700 Kč, tak tento příjem nesníží progress bar, jelikož nemá nic společného s nastaveným limitem pro útratu za jídlo.
                     *
                     * Myslím, že jsem to jen špatně pojmenoval, tzn. že místo "Budgeting" by se tato stránka měla jmenovat spíše "Spending Limits" nebo "Expense Tracking", protože se jedná o sledování a hlídání útrat vůči nastaveným limitům.
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

      <BaseModal
        title="Upravit komplexní rozpočet"
        isOpen={isEditComplexModalOpen}
        onClose={() => setEditComplexModalOpen(false)}
      >
        <EditComplexBudgetModal
          onCancel={() => setEditComplexModalOpen(false)}
        />
      </BaseModal>
    </>
  );
}
