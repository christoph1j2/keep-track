import { useCategoryStore } from "../../store/categoryStore";
import { useTransactionStore } from "../../store/transactionStore";
import type { Category } from "../../types/category";
import { CategoryIcon } from "../Base/CategoryIcon";

type ExpensiveCategory = Pick<Category, "id" | "label" | "iconName" | "colorClass"> & {
    totalAmount: number;
};

/**
 * @deprecated This component is not in use on the dashboard anymore. It may be removed in the future, but for now it is kept for potential reuse or reference.
 * 
 * Shows the top expense categories for the current month.
 * Expenses are grouped by category, converted to absolute totals, then sorted descending.
 * 
 * @param props.transactions Transactions to analyze for expensive categories.
 * 
 */
export function ExpensiveCategories() {
    const categories = useCategoryStore((state) => state.categories);
    const transactions = useTransactionStore((state) => state.transactions);

    const now = new Date();
    const currentMonthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    // Summarize expenses by category
    const categorySums = currentMonthTransactions
        .filter(t => t.amount < 0) // Expenses only
        .reduce((acc, t) => {
            const catId = t.categoryId || "uncategorized";
            if (!acc[catId]) {
                acc[catId] = 0;
            }
            acc[catId] += Math.abs(t.amount);
            return acc;
        }, {} as Record<string, number>);

    const expensiveCategories: ExpensiveCategory[] = Object.entries(categorySums) // Convert dictionary to array
        .map(([categoryId, totalAmount]) => {
            const category = categories.find((c) => c.id === categoryId);
            return {
                id: categoryId,
                label: category?.label || "Unassigned",
                iconName: category?.iconName || "QuestionMark",
                colorClass: category?.colorClass || "bg-gray-200 text-gray-600",
                totalAmount
            };
        })
        .sort((a,b) => b.totalAmount - a.totalAmount) // Sort descending
        .slice(0, 4); // Display top 4 categories

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Top Expense Categories for {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex flex-col gap-1">
                {expensiveCategories.map((category) => (
                    <div 
                        key={category.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-200 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                        {/* Category name and icon */}
                        <div className="flex items-center">
                            <div className={`p-1 rounded-lg ${category.colorClass}`}>
                                <CategoryIcon 
                                    name={category.iconName}
                                />
                            </div>
                            <span className="ml-2">{category.label}</span>
                        </div>
                            <span className={`font-medium before:content-['-']`}>
                            {category.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
                            </span>
                    </div>
                ))}

                {expensiveCategories.length === 0 && (
                    <div className="text-center text-slate-400 py-4 italic">
                        No expenses this month.
                    </div>
                )}
            </div>
        </section>
    );
}