import { useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { BaseModal } from "../components/BaseModal";
import { StatCard } from "../components/StatCard";
import { QuickAddButton } from '../components/QuickAddButton';
import { Add, TrendingUp, TrendingDown, CalendarMonth, Euro, LocalCafe } from "@mui/icons-material";

export function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { transactions, addTransaction } = useTransactions();

    const now = new Date();
    const currentMonthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const income = currentMonthTransactions
                    .filter(t => t.amount > 0)
                    .reduce((sum, currentItem) => sum + currentItem.amount, 0);
    const expenses = Math.abs(currentMonthTransactions
                    .filter(t => t.amount < 0)
                    .reduce((sum, currentItem) => sum + currentItem.amount, 0));
    const balance = income - expenses;

    return (
        <div className="p-2">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Dashboard</h2>

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
                budget_status="OK" // GOOD, BAD, OK, //TODO based on the budgeting in the budgeting tab
                icon={<CalendarMonth />}
            />

        {/** second row, left col - quick add and graph */}
        <div className="lg:col-span-2 md:col-span-2 space-y-6">
            {/** quick add sekce */}
            <section className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Quick Add</h3>
            <div className="flex gap-4 overflow-x-auto">
                {/** Quick add buttons will be rendered here, */}
                {/** for now, hardcoded example buttons */}
                <QuickAddButton 
                    title="Přidat"
                    icon={<Add />}
                    colorClass="bg-gray-200 text-gray-600"
                    onClick={() => {
                        setIsModalOpen(true);
                    }}
                />
                <QuickAddButton 
                    title="Káva"
                    icon={<LocalCafe />}
                    amount={-30}
                    colorClass="bg-orange-200 text-orange-600"
                    onClick={() => {
                        addTransaction({
                            id: crypto.randomUUID(),
                            title: "Káva",
                            amount: -30,
                            categoryId: "food_beverage",
                            date: new Date().toISOString(),
                        });
                    }}
                />
            </div>
            </section>

            {/** graph sekce */}
            <section className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold mb-4">Příjmy vs Výdaje</h3>
                <div className="h-64">{/** tady bude graf */}</div>
            </section>
        </div>

        {/** second row, right col - transactions and categories */}
        <div className="lg:col-span-2 md:col-span-2 space-y-6">
            {/** transactions sekce */}
            <section className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold mb-4">Poslední transakce</h3>
                <div>{/** tady bude seznam posledních transakcí */}</div>
            </section>

            {/** categories sekce */}
            <section className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold mb-4">Nejčastější kategorie</h3>
                <div>{/** tady bude seznam nejčastějších kategorií */}</div>
            </section>
        </div>
        
        <BaseModal
            title="Moje první okno!"
            isOpen={isModalOpen}
            onClose={()=>{
                setIsModalOpen(false);
            }}
        >
            <p>obsah uvnitr modalu</p>
        </BaseModal>
        </div>
        </div>
    )
}