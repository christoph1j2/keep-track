import { useState } from "react";
import { useQuickAddTemplates } from "../hooks/useQuickAddTemplates";
import { BaseModal } from "../components/Modals/BaseModal";
import { StatCard } from "../components/Dashboard/StatCard";
import { QuickAddButton } from '../components/QuickAdd/QuickAddButton';
import { Add, TrendingUp, TrendingDown, CalendarMonth, Euro } from "@mui/icons-material";
import { Graph } from "../components/Dashboard/Graph";
import { LastTransactions } from "../components/Dashboard/LastTransactions";
import { useCategories } from "../hooks/useCategories";
import { CategoryIcon } from "../components/Base/CategoryIcon";
import { AddTransactionModal } from "../components/Modals/AddTransactionModal";
import { useBudgets } from "../hooks/useBudgets";
import { BudgetingList } from "../components/Dashboard/BudgetingList";
import { generateMockTransactions } from "../utils/mockDataGenerator";
import { useTransactionStore } from "../store/transactionStore";

/**
 * Dashboard page that summarizes monthly performance and recent activity.
 * It combines computed metrics, quick actions, chart trends, and compact transaction widgets.
 */
export function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { templates } = useQuickAddTemplates();
    const { categories } = useCategories();
    const hotbarTemplates = templates.filter((template) => template.showInHotbar);
    const { budgets } = useBudgets();

    const { transactions, addTransaction, clearTransactions, loadMockData } = useTransactionStore();


    const now = new Date();
    const currentMonthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const budgetStatus = budgets.length > 0 ? (() => {
        let exceeded = 0;
        let ok = 0;

        budgets.forEach(budget => {
            const categoryTransactions = currentMonthTransactions.filter(t => t.categoryId === budget.categoryId);
            const totalSpent = categoryTransactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            if (totalSpent > budget.limit) {
                exceeded++;
            }
            if (totalSpent > budget.limit * 0.8) {
                ok++;
            }
        });

        if (exceeded > 0) return 'BAD';
        if (ok > 0) return 'OK';
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
        <div className="p-0">
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-center text-3xl font-bold text-slate-800">Dashboard</h2>
            <div className="flex flex-col md:flex-row gap-2">
                <button
                    className="bg-slate-500 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                    onClick={() => {
                        console.warn("Reset Data");
                        if (window.confirm("⚠️POZOR!⚠️ \nOpravdu chcete resetovat data?\nTato akce smaže veškeré transakce a nelze vrátit zpět.")) {
                            clearTransactions();
                        }
                    }}>
                    Resetovat Data
                </button>
                <button
                    className="bg-slate-500 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                    onClick={() => {
                        console.warn("Generate data");
                        if (window.confirm("⚠️POZOR!⚠️ \nOpravdu chcete vygenerovat náhodná data?\nTato akce přepíše veškeré stávající transakce, vrátí 200 nových náhodných transakcí a nelze vrátit zpět.")) {
                            const mockData = generateMockTransactions(categories);
                            loadMockData(mockData);
                        }
                    }}>
                    Generovat Data
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/** first row - stat cards */}
            <StatCard 
                title="Příjmy tento měsíc"
                amount={income}
                icon={<TrendingUp />}
                trend={true}
            />
            <StatCard 
                title="Výdaje tento měsíc"
                amount={expenses}
                icon={<TrendingDown />}
                trend={false}
            />
            <StatCard
                title="Bilance tento měsíc"
                amount={balance}
                icon={<Euro />}
            />
            <StatCard 
                title="Rozpočet tento měsíc"
                budget_status={budgetStatus}
                icon={<CalendarMonth />}
            />

        {/** second row, left col - quick add and graph */}
        <div className="lg:col-span-2 md:col-span-2 space-y-6">
            {/** quick add sekce */}
            <section className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Quick Add</h3>
            <div className="flex gap-4 overflow-x-auto">
                <QuickAddButton 
                    title="Přidat"
                    icon={<Add />}
                    colorClass="bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
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
                                if (window.confirm(`Přidat transakci: ${template.title}\n${template.amount.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}?`)) {
                                    addTransaction({
                                        title: template.title,
                                        amount: template.amount,
                                        categoryId: template.categoryId,
                                        date: new Date().toISOString(),
                                    });
                                }
                            }}
                        />
                    );
                })}
            </div>
            </section>

            {/** graph sekce */}
            <Graph/>
        </div>

        {/** second row, right col - transactions & categories */}
        <div className="lg:col-span-2 md:col-span-2 space-y-6">
            {/** transactions sekce */}
            <LastTransactions/>

                {/** categories sekce */}
                {/* <ExpensiveCategories
                    transactions={transactions}
                /> */}
                {/** budgeting sekce */}
                <BudgetingList 
                    budgets={budgets} 
                />
            
        </div>
        
        <BaseModal
            title="Přidat transakci"
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
