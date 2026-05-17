import { useCategories } from "../hooks/useCategories";
import { useTransactions } from "../hooks/useTransactions";
import { useBudgets } from '../hooks/useBudgets';
import { useState } from "react";

export function Budgeting() {
    const { transactions } = useTransactions();
    const { categories } = useCategories();
    const { budgets } = useBudgets();

    const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);

    

    return (
        <div className="p-2">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Moje Rozpočty</h2>
            <p className="text-slate-600">Tady budeme hlídat limity.</p>
        </div>
    );
}