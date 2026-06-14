import { useNavigate } from "react-router-dom";
import type { Budget } from "../../types/budget";
import { CategoryIcon } from "../Base/CategoryIcon";
import { ProgressBar } from "../Budgeting/ProgressBar";
import { useTransactionStore } from "../../store/transactionStore";
import { useCategoryStore } from "../../store/categoryStore";
import { useBudgetStore } from "../../store/budgetStore";

export function BudgetingList() {
    const budgets: Budget[] = useBudgetStore((state) => state.budgets);

    const categories = useCategoryStore((state) => state.categories);
    const transactions = useTransactionStore((state) => state.transactions);

    const navigate = useNavigate();
    
    const now = new Date();
    const currentMonthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const topBudgets = budgets.slice(0,4);

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold mb-4">Rozpočty</h3>
                <span onClick={() => navigate("/budgeting")} className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm transition-colors">
                    Všechny rozpočty
                </span>
            </div>
            <div className="flex flex-col gap-2">
            {topBudgets.map(budget => {
                const category = categories.find(c => c.id === budget.categoryId);
                if (!category) return null;

                const subcatIds = categories
                    .filter(c => c.parentId === budget.categoryId)
                    .map(c => c.id);

                const categoryTransactions = currentMonthTransactions.filter(
                    t => t.categoryId === budget.categoryId || subcatIds.includes(t.categoryId) 
                );

                const totalSpent = categoryTransactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

                return (
                    <div key={budget.categoryId} className="flex flex-col items-center justify-between py-2 px-4 hover:bg-slate-100 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                        <ProgressBar categoryIcon={<CategoryIcon name={category.iconName} />} categoryName={category.label} progress={totalSpent} limit={budget.limit} />
                    </div>
                )
            })}
            </div>
        </section>
    )
};