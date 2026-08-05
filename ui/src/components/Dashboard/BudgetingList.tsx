import { useNavigate } from "react-router-dom";
import { CategoryIcon } from "../Base/CategoryIcon";
import { ProgressBar } from "../Budgeting/ProgressBar";
import { useTransactionStore } from "../../store/transactionStore";
import { useCategoryStore } from "../../store/categoryStore";
import { useBudgetStore } from "../../store/budgetStore";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@mui/material";

export function BudgetingList() {
  const {
    budgets,
    complexBudget,
    isLoading: isBudgetLoading,
  } = useBudgetStore();
  const { categories, isLoading: isCategoryLoading } = useCategoryStore();
  const { transactions, isLoading: isTxLoading } = useTransactionStore();
  const navigate = useNavigate();

  const isLoading = isBudgetLoading || isTxLoading || isCategoryLoading;
  const { t } = useTranslation();

  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });

  const topBudgets = budgets.slice(0, 4);

  const totalSpentAll = currentMonthTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton
              key={idx}
              variant="rectangular"
              height={52}
              className="rounded-lg my-1 bg-slate-200! dark:bg-slate-800/80!"
            />
          ))}
        </div>
      ) : budgets.length > 0 || complexBudget ? (
        <div className="flex flex-col gap-2">
          {complexBudget && (
            <div className="flex flex-col items-center justify-between py-2 px-4 bg-sky-50 rounded-lg border border-sky-100 transition-colors dark:bg-sky-900 dark:border-sky-700 w-full mb-2">
              <ProgressBar
                categoryName="Celkový útrata"
                progress={totalSpentAll}
                limit={complexBudget.limit}
              />
            </div>
          )}
          {topBudgets.map((budget) => {
            const category = categories.find((c) => c.id === budget.categoryId);
            if (!category) return null;

            const categoryLabel = category.label.startsWith(
              "default_categories.",
            )
              ? t(category.label)
              : category.label;

            const subcatIds = categories
              .filter((c) => c.parentId === budget.categoryId)
              .map((c) => c.id);

            const categoryTransactions = currentMonthTransactions.filter(
              (tx) =>
                tx.amount < 0 &&
                (tx.categoryId === budget.categoryId ||
                  subcatIds.includes(tx.categoryId || "")),
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
