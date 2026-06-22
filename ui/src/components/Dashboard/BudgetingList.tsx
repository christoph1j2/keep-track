import { useNavigate } from "react-router-dom";
import type { Budget } from "../../types/budget";
import { CategoryIcon } from "../Base/CategoryIcon";
import { ProgressBar } from "../Budgeting/ProgressBar";
import { useTransactionStore } from "../../store/transactionStore";
import { useCategoryStore } from "../../store/categoryStore";
import { useBudgetStore } from "../../store/budgetStore";
import { useTranslation } from "react-i18next";

export function BudgetingList() {
  const budgets: Budget[] = useBudgetStore((state) => state.budgets);
  const categories = useCategoryStore((state) => state.categories);
  const transactions = useTransactionStore((state) => state.transactions);
  const navigate = useNavigate();

  const { t } = useTranslation();

  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });

  const category = categories.find((c) => c.id === budgets[0]?.categoryId);
  if (!category) return null;
  const categoryLabel = category.label.startsWith("default_categories.")
    ? t(category.label)
    : category.label;

  const topBudgets = budgets.slice(0, 4);

  return (
    <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">
          {t("dashboard.budgetingList.title")}
        </h3>
        <span
          onClick={() => navigate("/budgeting")}
          className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm transition-colors"
        >
          {t("dashboard.budgetingList.allBudgets")}
        </span>
      </div>

      {budgets.length > 0 ? (
        <div className="flex flex-col gap-2">
          {topBudgets.map((budget) => {
            const category = categories.find((c) => c.id === budget.categoryId);
            if (!category) return null;

            const subcatIds = categories
              .filter((c) => c.parentId === budget.categoryId)
              .map((c) => c.id);

            const categoryTransactions = currentMonthTransactions.filter(
              (t) =>
                t.categoryId === budget.categoryId ||
                subcatIds.includes(t.categoryId),
            );

            const totalSpent = categoryTransactions
              .filter((t) => t.amount < 0)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            return (
              <div
                key={budget.categoryId}
                className="flex flex-col items-center justify-between py-2 px-4 hover:bg-slate-100 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors dark:hover:bg-slate-800 dark:border-slate-800 dark:hover:border-slate-700 w-full"
              >
                <ProgressBar
                  categoryIcon={<CategoryIcon name={category.iconName} />}
                  categoryName={categoryLabel}
                  progress={totalSpent}
                  limit={budget.limit}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm text-center italic">
            {t("dashboard.budgetingList.emptyMessage")}
          </p>
        </div>
      )}
    </section>
  );
}
