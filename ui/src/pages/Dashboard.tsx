import { useState } from "react";
import { BaseModal } from "../components/Modals/BaseModal";
import { StatCard } from "../components/Dashboard/StatCard";
import { QuickAddButton } from '../components/QuickAdd/QuickAddButton';
import { Add, TrendingUp, TrendingDown, CalendarMonth, Euro } from "@mui/icons-material";
import { Graph } from "../components/Dashboard/Graph";
import { LastTransactions } from "../components/Dashboard/LastTransactions";
import { CategoryIcon } from "../components/Base/CategoryIcon";
import { AddTransactionModal } from "../components/Modals/AddTransactionModal";
import { BudgetingList } from "../components/Dashboard/BudgetingList";
import { generateMockTransactions } from "../utils/mockDataGenerator";
import { useTransactionStore } from "../store/transactionStore";
import { useCategoryStore } from "../store/categoryStore";
import { useTemplateStore } from "../store/quickAddTemplateStore";
import { useBudgetStore } from "../store/budgetStore";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConfirmStore } from "../store/confirmStore";
import { formatCurrency } from "../utils/formatCurrency";

/**
 * Dashboard page that summarizes monthly performance and recent activity.
 * It combines computed metrics, quick actions, chart trends, and compact transaction widgets.
 */
export function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const showConfirm = useConfirmStore((state) => state.showConfirm);

    const templates = useTemplateStore((state) => state.templates);
    const hotbarTemplates = templates.filter((template) => template.showInHotbar);
    const budgets = useBudgetStore((state) => state.budgets);

    const { transactions, addTransaction, clearTransactions, loadMockData } = useTransactionStore();
    const categories = useCategoryStore((state) => (state.categories));

    const { t } = useTranslation();

    const now = new Date();
    const currentMonthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const budgetStatus = budgets.length > 0 ? (() => {
        let exceeded = 0;
        let warning = 0;

        // 1. Create a fast lookup map of subCategory -> parentCategory once
        const parentMap = new Map();
        categories.forEach(c => {
            if (c.parentId) parentMap.set(c.id, c.parentId);
        });

        budgets.forEach(budget => {
            const categoryTransactions = currentMonthTransactions.filter(t => {
                // 2. Instant lookup: check if direct ID matches or mapped parent ID matches
                const resolvedCategoryId = parentMap.get(t.categoryId) || t.categoryId;
                return resolvedCategoryId === budget.categoryId;
            });

            const totalSpent = categoryTransactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            if (totalSpent > budget.limit) {
                exceeded++;
            } else if (totalSpent > budget.limit * 0.8) {
                warning++;
            }
        });

        if (exceeded > 0) return 'BAD';
        if (warning > 0) return 'OK';
        return 'GOOD';
    })() : 'N/A';

    const income = currentMonthTransactions
                    .filter(t => t.amount > 0)
                    .reduce((sum, currentItem) => sum + currentItem.amount, 0);
    const expenses = Math.abs(currentMonthTransactions
                    .filter(t => t.amount < 0)
                    .reduce((sum, currentItem) => sum + currentItem.amount, 0));
    const balance = income - expenses;

    return (
        <div className="p-0 dark:text-slate-100 transition-colors">
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 dark:text-slate-100 transition-colors">
            <h2 className="text-center text-3xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
                {t("dashboard.title")}
            </h2>  
            <div className="flex flex-col md:flex-row gap-2">
                <button
                    className="bg-slate-500 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                    onClick={() => {
                        showConfirm(
                            t("dashboard.buttons.resetData"),
                            t("dashboard.buttons.resetDataConfirm"),
                            () => clearTransactions()
                        );
                    }}>
                    {t("dashboard.buttons.resetData")}
                </button>
                <button
                    className="bg-slate-500 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                    onClick={() => {
                        showConfirm(
                            t("dashboard.buttons.generateData"),
                            t("dashboard.buttons.generateDataConfirm"),
                            () => {
                                const mockData = generateMockTransactions(categories);
                                loadMockData(mockData);
                            }
                        );
                    }}>
                    {t("dashboard.buttons.generateData")}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/** first row, left col - stat cards */}
            <StatCard 
                title={t("dashboard.stats.income")}
                amount={income}
                icon={<TrendingUp />}
                trend={true}
            />
            <StatCard 
                title={t("dashboard.stats.expenses")}
                amount={expenses}
                icon={<TrendingDown />}
                trend={false}
            />
            <StatCard
                title={t("dashboard.stats.balance")}
                amount={balance}
                icon={<Euro />}
            />
            <StatCard 
                title={t("dashboard.stats.budget")}
                budget_status={budgetStatus}
                icon={<CalendarMonth />}
            />

        {/** second row, left col - quick add and graph */}
        <div className="lg:col-span-2 md:col-span-2 space-y-4">
            {/** quick add sekce */}
            <section className="bg-white p-6 rounded-2xl shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 transition-colors">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold mb-4">Quick Add</h3>
                <Link to="/quickadd" className="text-sm text-blue-500 hover:underline mb-4 inline-block">{t("dashboard.links.manageTemplates")}</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto">
                <QuickAddButton 
                    title={t("common.add")}
                    icon={<Add />}
                    colorClass="bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
                    onClick={() => {
                        setIsModalOpen(true);
                    }}
                />
                {hotbarTemplates.map((template) => {
                    const category = categories.find((cat) => cat.id === template.categoryId);

                    return (
                        <QuickAddButton
                            key={template.id}
                            title={template.title}
                            icon={<CategoryIcon name={category?.iconName ?? "QuestionMark"} />}
                            amount={template.amount}
                            colorClass={`${category?.colorClass || "bg-gray-200 text-gray-800"} hover:opacity-80 transition-opacity`}
                            onClick={() => {
                                showConfirm(
                                    t("dashboard.modalTitle"),
                                    t("dashboard.transactionConfirm", {
                                        title: template.title,
                                        amount: formatCurrency(template.amount)
                                    }),
                                    () => {
                                        addTransaction({
                                            title: template.title,
                                            amount: template.amount,
                                            categoryId: template.categoryId,
                                            date: new Date().toISOString(),
                                        });
                                })
                            }}
                        />
                    );
                })}
            </div>
            </section>


            {/** transactions sekce */}
            <LastTransactions/>
        </div>

        {/** second row, right col - transactions & categories */}
        <div className="lg:col-span-2 md:col-span-2 space-y-6">
            {/** graph sekce */}
            <Graph/>

            {/** budgeting sekce */}
            <BudgetingList/>
            
        </div>
        
        <BaseModal
            title={t("dashboard.modalTitle")}
            isOpen={isModalOpen}
            onClose={()=>{
                setIsModalOpen(false);
            }}
        >
            <AddTransactionModal
                onCancel={() => setIsModalOpen(false)}
            />
        </BaseModal>

        </div>
        </div>
    )
}
