import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useConfirmStore } from "../../store/confirmStore";
import { useBudgetStore } from "../../store/budgetStore";
import { useCategoryStore } from "../../store/categoryStore";
import { useTransactionStore } from "../../store/transactionStore";
import {
  Delete,
  Edit,
  AccountBalanceWallet,
  ReceiptLong,
  Savings,
  Payments,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  WarningAmber,
  InfoOutlined,
} from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { CategoryIcon } from "../Base/CategoryIcon";
import { ProgressBar } from "./ProgressBar";
import { BaseModal } from "../Modals/BaseModal";
import { EditComplexBudgetModal } from "../Modals/EditComplexBudgetModal";
import { formatCurrency } from "../../utils/formatCurrency";

export function ComplexBudget() {
  const { complexBudget, removeComplexBudget } = useBudgetStore();
  const { categories } = useCategoryStore();
  const { transactions } = useTransactionStore();
  const navigate = useNavigate();

  const [isEditComplexModalOpen, setEditComplexModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "over" | "on_track">("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  if (!complexBudget) return null;

  const now = new Date();
  const currentMonthTransactions = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });

  const complexCategoryIds =
    complexBudget.categories?.map((c) => c.categoryId) ?? [];

  // Map each category to include any child subcategories
  const subcatMap: Record<string, string[]> = {};
  const allComplexAndSubcatIds = new Set<string>();
  for (const catId of complexCategoryIds) {
    const subIds = categories
      .filter((c) => c.parentId === catId)
      .map((c) => c.id);
    subcatMap[catId] = subIds;
    allComplexAndSubcatIds.add(catId);
    subIds.forEach((id) => allComplexAndSubcatIds.add(id));
  }

  // Total other spending outside of necessary categories
  const totalSpentOther = currentMonthTransactions
    .filter(
      (t) => t.amount < 0 && !allComplexAndSubcatIds.has(t.categoryId || ""),
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Income & surplus calculations
  const totalIncome = currentMonthTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const surplus = Math.max(0, totalIncome - complexBudget.income);
  const flexibleLimit = Math.max(0, complexBudget.limit + surplus);
  const flexibleRemaining = flexibleLimit - totalSpentOther;

  // Enriched categories with subcategory spending included
  const enrichedCategories = (complexBudget.categories ?? []).map(
    (budgetCat) => {
      const subIds = subcatMap[budgetCat.categoryId] || [];
      const spent = currentMonthTransactions
        .filter(
          (t) =>
            t.amount < 0 &&
            (t.categoryId === budgetCat.categoryId ||
              subIds.includes(t.categoryId || "")),
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const remainingOrOver = budgetCat.limit - spent;
      const isOver = spent > budgetCat.limit;
      const category =
        categories.find((c) => c.id === budgetCat.categoryId) ||
        budgetCat.category;

      const categoryLabel = category?.label?.startsWith("default_categories.")
        ? t(category.label)
        : category?.label || t("common.unknownCategory");

      return {
        ...budgetCat,
        category,
        categoryLabel,
        spent,
        remainingOrOver,
        isOver,
      };
    },
  );

  const totalNecessarySpent = enrichedCategories.reduce(
    (sum, c) => sum + c.spent,
    0,
  );
  const effectiveIncome = Math.max(complexBudget.income, totalIncome);
  const totalSpentOverall = totalSpentOther + totalNecessarySpent;
  const netRemaining = effectiveIncome - totalSpentOverall;

  // Filtered categories
  const filteredCategories = enrichedCategories.filter((c) => {
    if (filter === "over") return c.isOver;
    if (filter === "on_track") return !c.isOver;
    return true;
  });

  const overLimitCount = enrichedCategories.filter((c) => c.isOver).length;
  const onTrackCount = enrichedCategories.length - overLimitCount;

  // Collapse long category list when on "all" tab
  const shouldShowExpandToggle =
    filter === "all" && enrichedCategories.length > 6;
  const displayedCategories =
    shouldShowExpandToggle && !isExpanded
      ? filteredCategories.slice(0, 6)
      : filteredCategories;

  const handleCategoryClick = (categoryId: string) => {
    navigate("/overview", { state: { selectedCategoryId: categoryId } });
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {t("budgeting.complexTitle")}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                {t("budgeting.categoriesCount", {
                  count: enrichedCategories.length,
                })}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {surplus > 0
                ? t("budgeting.complexDetailsSurplus", {
                    income: formatCurrency(complexBudget.income),
                    surplus: formatCurrency(surplus),
                    necessaryExpenses: formatCurrency(
                      complexBudget.necessaryExpenses,
                    ),
                  })
                : t("budgeting.complexDetails", {
                    income: formatCurrency(complexBudget.income),
                    necessaryExpenses: formatCurrency(
                      complexBudget.necessaryExpenses,
                    ),
                  })}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setEditComplexModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title={t("budgeting.editComplexTitle")}
            >
              <Edit
                fontSize="small"
                className="text-slate-500 dark:text-slate-400"
              />
              <span>{t("common.edit")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                showConfirm(
                  t("common.warning"),
                  t("budgeting.deleteConfirmComplex"),
                  () => removeComplexBudget(),
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 transition-colors"
              title={t("common.delete")}
            >
              <Delete fontSize="small" />
              <span>{t("common.delete")}</span>
            </button>
          </div>
        </div>

        {/* Top-Level KPI Metric Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Monthly Income Card */}
          <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-medium truncate flex items-center gap-1">
                {t("budgeting.monthlyIncome")}
                <Tooltip
                  title={t("budgeting.tooltips.monthlyIncome")}
                  arrow
                  placement="top"
                >
                  <InfoOutlined
                    sx={{ fontSize: { xs: 18, sm: 16, md: 14 } }}
                    className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  />
                </Tooltip>
              </span>
              <div className="p-1 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <AccountBalanceWallet
                  sx={{ fontSize: { xs: 16, sm: 16, md: 16 } }}
                />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(complexBudget.income)}
            </div>
            {surplus > 0 ? (
              <div className="mt-1 text-2xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                {t("budgeting.surplusBadge", {
                  amount: formatCurrency(surplus),
                })}
              </div>
            ) : (
              <div className="mt-1 text-2xs text-slate-400 dark:text-slate-500 truncate">
                {formatCurrency(totalIncome)}
              </div>
            )}
          </div>

          {/* Fixed Expenses Target */}
          <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-medium truncate flex items-center gap-1">
                {t("budgeting.fixedExpenses")}
                <Tooltip
                  title={t("budgeting.tooltips.fixedExpenses")}
                  arrow
                  placement="top"
                >
                  <InfoOutlined
                    sx={{ fontSize: { xs: 18, sm: 16, md: 14 } }}
                    className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  />
                </Tooltip>
              </span>
              <div className="p-1 rounded-md bg-sky-100/80 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <ReceiptLong sx={{ fontSize: { xs: 16, sm: 16, md: 16 } }} />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(complexBudget.necessaryExpenses)}
            </div>
            <div className="mt-1 text-2xs text-slate-500 dark:text-slate-400 truncate">
              {t("budgeting.spentSoFar", {
                amount: formatCurrency(totalNecessarySpent),
              })}
            </div>
          </div>

          {/* Flexible Pool */}
          <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-medium truncate flex items-center gap-1">
                {t("budgeting.flexiblePool")}
                <Tooltip
                  title={t("budgeting.tooltips.flexiblePool")}
                  arrow
                  placement="top"
                >
                  <InfoOutlined
                    sx={{ fontSize: { xs: 18, sm: 16, md: 14 } }}
                    className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  />
                </Tooltip>
              </span>
              <div className="p-1 rounded-md bg-amber-100/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Savings sx={{ fontSize: { xs: 16, sm: 16, md: 16 } }} />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(flexibleLimit)}
            </div>
            <div className="mt-1 text-2xs text-slate-500 dark:text-slate-400 truncate">
              {t("budgeting.spentSoFar", {
                amount: formatCurrency(totalSpentOther),
              })}
            </div>
          </div>

          {/* Net Remaining Balance */}
          <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-medium truncate flex items-center gap-1">
                {t("budgeting.netRemaining")}
                <Tooltip
                  title={t("budgeting.tooltips.netRemaining")}
                  arrow
                  placement="top"
                >
                  <InfoOutlined
                    sx={{ fontSize: { xs: 18, sm: 16, md: 14 } }}
                    className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  />
                </Tooltip>
              </span>
              <div
                className={`p-1 rounded-md ${
                  netRemaining >= 0
                    ? "bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-100/80 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                }`}
              >
                <Payments sx={{ fontSize: { xs: 16, sm: 16, md: 16 } }} />
              </div>
            </div>
            <div
              className={`text-base sm:text-lg font-bold ${
                netRemaining >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(netRemaining)}
            </div>
            <div className="mt-1 text-2xs text-slate-500 dark:text-slate-400 truncate">
              {t("budgeting.totalSpent", {
                amount: formatCurrency(totalSpentOverall),
              })}
            </div>
          </div>
        </div>

        {/* Hero Card: Flexible Spending */}
        <div className="bg-sky-50/60 dark:bg-sky-950/20 rounded-xl p-4 border border-sky-100/80 dark:border-sky-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {t("budgeting.flexibleSpendingTitle")}
              </span>
            </div>
            <div className="text-xs">
              {flexibleRemaining >= 0 ? (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  {t("budgeting.remainingOfLimit", {
                    remaining: formatCurrency(flexibleRemaining),
                    limit: formatCurrency(flexibleLimit),
                  })}
                </span>
              ) : (
                <span className="font-semibold text-red-700 dark:text-red-400 bg-red-100/70 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                  {t("budgeting.categoryOver", {
                    amount: formatCurrency(Math.abs(flexibleRemaining)),
                  })}
                </span>
              )}
            </div>
          </div>
          <ProgressBar
            categoryName={t("budgeting.otherExpenses")}
            progress={totalSpentOther}
            limit={flexibleLimit}
          />
        </div>

        {/* Necessary Categories Section */}
        {enrichedCategories.length > 0 && (
          <div className="flex flex-col gap-3.5 pt-1">
            {/* Header & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                  {t("budgeting.necessaryExpensesTitle")}
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ({enrichedCategories.length})
                </span>
              </div>

              {enrichedCategories.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filter === "all"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {t("budgeting.filterAll")} ({enrichedCategories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("over")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filter === "over"
                        ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {t("budgeting.filterOverLimit")} ({overLimitCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("on_track")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filter === "on_track"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {t("budgeting.filterOnTrack")} ({onTrackCount})
                  </button>
                </div>
              )}
            </div>

            {/* 2-Column Responsive Grid */}
            {displayedCategories.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                {t("budgeting.noCategoriesMatch")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {displayedCategories.map((cat) => {
                  const percentage =
                    cat.limit > 0
                      ? Math.round((cat.spent / cat.limit) * 100)
                      : cat.spent > 0
                        ? 100
                        : 0;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.categoryId)}
                      className="group bg-slate-50/70 hover:bg-slate-100/90 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 rounded-xl p-4 border border-slate-200/70 dark:border-slate-700/60 transition-all cursor-pointer flex flex-col justify-between gap-2"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCategoryClick(cat.categoryId);
                        }
                      }}
                    >
                      <ProgressBar
                        categoryName={cat.categoryLabel}
                        categoryIcon={
                          <span className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs border border-slate-200/50 dark:border-slate-600/50 inline-flex items-center justify-center">
                            <CategoryIcon
                              name={cat.category?.iconName || ""}
                              className="text-base"
                            />
                          </span>
                        }
                        progress={cat.spent}
                        limit={cat.limit}
                      />

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                        <span className="font-medium">{percentage}%</span>
                        {cat.isOver ? (
                          <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                            <WarningAmber sx={{ fontSize: 13 }} />
                            {t("budgeting.categoryOver", {
                              amount: formatCurrency(
                                Math.abs(cat.remainingOrOver),
                              ),
                            })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <CheckCircle sx={{ fontSize: 13 }} />
                            {t("budgeting.categoryRemaining", {
                              amount: formatCurrency(cat.remainingOrOver),
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expand / Collapse Button */}
            {shouldShowExpandToggle && (
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 py-1.5 px-3 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                >
                  <span>
                    {isExpanded
                      ? t("budgeting.showLessCategories")
                      : t("budgeting.showAllCategories", {
                          count: enrichedCategories.length,
                        })}
                  </span>
                  {isExpanded ? (
                    <ExpandLess fontSize="small" />
                  ) : (
                    <ExpandMore fontSize="small" />
                  )}
                </button>
              </div>
            )}
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
