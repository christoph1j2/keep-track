import { useCategories } from "../hooks/useCategories";
import { useTransactions } from "../hooks/useTransactions";
import { useBudgets } from '../hooks/useBudgets';
import { useState } from "react";
import { ProgressBar } from "../components/Budgeting/ProgressBar";
import { CategoryIcon } from "../components/Base/CategoryIcon";
import { BaseModal } from "../components/Modals/BaseModal";
import { AddBudgetModal } from "../components/Modals/AddBudgetModal";
import { Delete, Edit } from "@mui/icons-material";
import { EditBudgetModal } from "../components/Modals/EditBudgetModal";

/**
 * Budgeting page for managing monthly spending limits.
 * Displays progress bars for each budget category, and allows create, update, and delete actions.
 */
export function Budgeting() {
    const { transactions } = useTransactions();
    const { categories } = useCategories();
    const { budgets, setBudget, removeBudget } = useBudgets();

    const [selectedBudget, setSelectedBudget] = useState<typeof budgets[0]>();

    const [isAddBudgetModalOpen, setAddBudgetModalOpen] = useState(false);
    const [isEditBudgetModalOpen, setEditBudgetModalOpen] = useState(false);

    const now = new Date();
    const currentMonthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    return (
        <>
        <div className="h-full flex flex-col gap-4">
            <div className="mb-6 flex flex-col items-center text-center md:flex-row md:justify-between md:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Plánování rozpočtů tento měsíc</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full md:w-fit"
                onClick={() => setAddBudgetModalOpen(true)}
                >
                    + Přidat rozpočet
                </button>
            </div>

            {/** tady budou "progress bars" rozpočtů */}
            {budgets.map(budget => {
                const category = categories.find(c => c.id === budget.categoryId);
                if (!category) return null;
                // console.log('Budget:', budget);
                const categoryTransactions = currentMonthTransactions.filter(t => t.categoryId === budget.categoryId);
                const totalSpent = categoryTransactions
                    .filter((t) => t.amount < 0)
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

                return (
                    <div
                        key={budget.categoryId}
                        className="inline-flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm sm:gap-4 sm:p-6"
                    >
                        <ProgressBar
                            categoryName={category.label}
                            categoryIcon={<CategoryIcon name={category.iconName} className="" />}
                            progress={totalSpent}
                            limit={budget.limit}
                        />
                        
                        <div className="flex flex-col gap-2 ml-auto">
                            <button
                                onClick={() => {
                                    setSelectedBudget(budget);
                                    setEditBudgetModalOpen(true);
                                }}
                                className="shrink-0 rounded-md px-1 font-semibold text-slate-600 transition-colors hover:bg-slate-50 inline-flex items-center gap-1">
                                <Edit fontSize="medium" />
                                Upravit
                            </button>
                            <button
                                onClick={() => removeBudget(budget.categoryId)}
                                className="shrink-0 rounded-md px-1 font-semibold text-red-600 transition-colors hover:bg-red-50 inline-flex items-center gap-1"
                            >
                                <Delete fontSize="medium" />
                                Smazat
                            </button>
                        </div>
                    </div>
                );
            })}
            {budgets.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                    <p className="text-lg">Žádné rozpočty nenastaveny.</p>
                    <p className="text-sm">Klikněte na "+ Přidat rozpočet" pro vytvoření prvního rozpočtu.</p>
                </div>
            )}
        </div>

        <BaseModal
            title="Přidat nový rozpočet"
            isOpen={isAddBudgetModalOpen}
            onClose={() => setAddBudgetModalOpen(false)}
        >
            <AddBudgetModal 
                onSubmit={(categoryId, limit) => {
                    setBudget(categoryId, limit);
                    setAddBudgetModalOpen(false);
                }}
                onCancel={() => setAddBudgetModalOpen(false)}
            />
        </BaseModal>

        <BaseModal
            title="Upravit rozpočet"
            isOpen={isEditBudgetModalOpen}
            onClose={() => setEditBudgetModalOpen(false)}
        >
            {selectedBudget && (
                <EditBudgetModal 
                    key={`${selectedBudget.categoryId}:${selectedBudget.limit}`}
                    budget={selectedBudget}
                    onSubmit={(categoryId, limit) => {
                        if (selectedBudget && selectedBudget.categoryId !== categoryId) {
                            removeBudget(selectedBudget.categoryId); // pokud se mění kategorie, smažeme původní rozpočet (kvůli klíči v useBudgets)
                        }
                        setBudget(categoryId, limit);
                        setEditBudgetModalOpen(false);
                    }}
                    onCancel={() => setEditBudgetModalOpen(false)}
                />
            )}
        </BaseModal>
        </>
    );
}
