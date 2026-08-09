import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirmStore } from "../../store/confirmStore";
import { useBudgetStore } from "../../store/budgetStore";
import { Delete, Edit } from "@mui/icons-material";
import { ProgressBar } from "./ProgressBar";
import { useTransactionStore } from "../../store/transactionStore";
import { BaseModal } from "../Modals/BaseModal";
import { EditComplexBudgetModal } from "../Modals/EditComplexBudgetModal";

export function ComplexBudget() {
    const { complexBudget, removeComplexBudget } = useBudgetStore();
    const { transactions } = useTransactionStore();

    const [isEditComplexModalOpen, setEditComplexModalOpen] = useState(false);
    const { t } = useTranslation();
    const showConfirm = useConfirmStore((state) => state.showConfirm);

    if (!complexBudget) return null;

    const spentByCategory: Record<string, number> = {};

    const now = new Date();
    const currentMonthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return (
            d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        );
    });

    const complexCategoryIds = complexBudget?.categories?.map((c) => c.categoryId) ?? [];

    const totalSpentOther = currentMonthTransactions
        .filter((t) => t.amount < 0 && !complexCategoryIds.includes(t.categoryId || ""))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    for (const tx of currentMonthTransactions) {
        if (!tx.categoryId) continue;

        if (!spentByCategory[tx.categoryId]) {
        spentByCategory[tx.categoryId] = 0;
        }

        spentByCategory[tx.categoryId] += tx.amount < 0 ? Math.abs(tx.amount) : 0;
    }

    const enrichedCategories = complexBudget?.categories
        ?.map((budgetCat) => {
            const spent = spentByCategory[budgetCat.categoryId] || 0;
            const surplusOrDeficit = budgetCat.limit - spent;
            return {
                ...budgetCat,
                spent,
                surplusOrDeficit,
            };
        }) ?? [];

    return (

      <>
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
              {t("budgeting.complexTitle")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("budgeting.complexDetails", {
                income: complexBudget.income,
                necessaryExpenses: complexBudget.necessaryExpenses
              })}
            </p>
          </div>
          <ProgressBar
            categoryName={t("budgeting.otherExpenses")}
            progress={totalSpentOther}
            limit={complexBudget.limit}
          />
          
          {enrichedCategories.length > 0 && (
            <div className="mt-6 pt-4 border-t border-sky-200 dark:border-sky-800 flex flex-col gap-4">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                {t("budgeting.necessaryExpensesTitle")}
              </h4>
              {enrichedCategories.map((cat) => (
                <ProgressBar
                  key={cat.id}
                  categoryName={
                    cat.category?.label?.startsWith("default_categories.")
                      ? t(cat.category.label)
                      : cat.category?.label || t("common.unknownCategory")
                  }
                  progress={cat.spent}
                  limit={cat.limit}
                />
              ))}
            </div>
          )}
        </div>

        <BaseModal
          title={t("budgeting.editComplexTitle")}
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