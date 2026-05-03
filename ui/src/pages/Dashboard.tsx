import { useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { BaseModal } from "../components/Base/BaseModal";
import { StatCard } from "../components/Dashboard/StatCard";
import { QuickAddButton } from '../components/QuickAddButton';
import { Add, TrendingUp, TrendingDown, CalendarMonth, Euro, LocalCafe } from "@mui/icons-material";
import { Graph } from "../components/Dashboard/Graph";
import { LastTransactions } from "../components/Dashboard/LastTransactions";

export function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { transactions, addTransaction } = useTransactions();


    const now = new Date();
    const currentMonthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const getTransactionsForMonth = (month: number) => {
        return transactions.filter((t) => {
            const d = new Date(t.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === month;
        });
    };


    const income = currentMonthTransactions
                    .filter(t => t.amount > 0)
                    .reduce((sum, currentItem) => sum + currentItem.amount, 0);
    const expenses = Math.abs(currentMonthTransactions
                    .filter(t => t.amount < 0)
                    .reduce((sum, currentItem) => sum + currentItem.amount, 0));
    const balance = income - expenses;

    return (
        <div className="p-0">
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
                {/** for now, hardcoded example buttons */} {/*TODO BASED ON ACTUAL QUICK ADD BUTTONS THE USER CREATED */}
                <QuickAddButton 
                    title="Přidat"
                    icon={<Add />}
                    colorClass="bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                    onClick={() => {
                        setIsModalOpen(true);
                    }}
                />
                <QuickAddButton 
                    title="Káva"
                    icon={<LocalCafe />}
                    amount={-30}
                    colorClass="bg-orange-200 text-orange-600 hover:bg-orange-300 transition-colors"
                    onClick={() => {
                        addTransaction({
                            id: crypto.randomUUID(),
                            title: "Káva",
                            amount: -30,
                            categoryId: "food",
                            date: new Date().toISOString(),
                        });
                    }}
                />
                <QuickAddButton 
                    title="Brigáda"
                    icon={<Euro />}
                    amount={10}
                    colorClass="bg-green-200 text-green-600 hover:bg-green-300 transition-colors"
                    onClick={() => {
                        addTransaction({
                            id: crypto.randomUUID(),
                            title: "Brigáda",
                            amount: 10,
                            categoryId: "salary",
                            date: new Date().toISOString(),
                        });
                    }}
                />
            </div>
            </section>

            {/** graph sekce */}
            <Graph 
                getTransactionsForMonth={getTransactionsForMonth}
                income={income}
                expenses={expenses}
            />
        </div>

        {/** second row, right col - transactions and categories */}
        <div className="lg:col-span-2 md:col-span-2 space-y-6">
            {/** transactions sekce */}
            <LastTransactions
                transactions={transactions}
            />

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