import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BaseModal } from "../components/Modals/BaseModal";
import { AddBudgetModal } from "../components/Modals/AddBudgetModal";
import { EditBudgetModal } from "../components/Modals/EditBudgetModal";
import { SortableBudgetItem } from "../components/Budgeting/SortableBudgetItem";
import { useTransactionStore } from "../store/transactionStore";
import { useCategoryStore } from "../store/categoryStore";
import { useBudgetStore } from "../store/budgetStore";

/**
 * Budgeting page for managing monthly spending limits.
 * Displays progress bars for each budget category with drag-and-drop reordering support.
 */
export function Budgeting() {
    const transactions = useTransactionStore((state) => state.transactions);
    const categories = useCategoryStore((state) => state.categories);
    const { budgets, removeBudget, reorderBudgets } = useBudgetStore();
    const navigate = useNavigate();

    const [selectedBudget, setSelectedBudget] = useState<typeof budgets[0]>();
    const [isAddBudgetModalOpen, setAddBudgetModalOpen] = useState(false);
    const [isEditBudgetModalOpen, setEditBudgetModalOpen] = useState(false);

    const handleProgressBarClick = (categoryId: string) => {
        navigate('/overview', { state: { selectedCategoryId: categoryId } });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = budgets.findIndex(b => b.categoryId === active.id);
        const newIndex = budgets.findIndex(b => b.categoryId === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        reorderBudgets(arrayMove(budgets, oldIndex, newIndex));
    };

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

            {budgets.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                    <p className="text-lg">Žádné rozpočty nenastaveny.</p>
                    <p className="text-sm">Klikněte na "+ Přidat rozpočet" pro vytvoření prvního rozpočtu.</p>
                </div>
            ) : (
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={budgets.map(b => b.categoryId)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-3">
                            {budgets.map(budget => {
                                const category = categories.find(c => c.id === budget.categoryId);
                                if (!category) return null;

                                //! zahrneme i transakce z podkategorií (logicky by měly být zahrnuty, protože rozpočet se vztahuje na celou kategorii včetně podkategorií)
                                const subcatIds = categories
                                    .filter(c => c.parentId === budget.categoryId)
                                    .map(c => c.id);

                                const categoryTransactions = currentMonthTransactions.filter(
                                    t => t.categoryId === budget.categoryId || subcatIds.includes(t.categoryId) 
                                );

                                /** NOTE:
                                 * Rozpočty slouží k hlídání a omezování útrat/výdajů
                                 * => do vyčerpaného limitu se počítají tedy pouze záporné transakce, ze kterých se počítá abs pro progress bar
                                 *
                                 * Příklad:
                                 * Jsem student, nastavím si rozpočet 2500 Kč na jídlo. Rozpočty hlídají, abych nepřekročil stanovený limit v rámci útraty v té dané kategorii. Pokud utratím 500 v pizzerii, progress bar vzroste o 500, atp. Pokud ale dostanu stipendium 700 Kč, tak tento příjem nesníží progress bar, jelikož nemá nic společného s nastaveným limitem pro útratu za jídlo.
                                 *
                                 * Myslím, že jsem to jen špatně pojmenoval, tzn. že místo "Budgeting" by se tato stránka měla jmenovat spíše "Spending Limits" nebo "Expense Tracking", protože se jedná o sledování a hlídání útrat vůči nastaveným limitům.
                                */
                                const totalSpent = categoryTransactions
                                    .filter((t) => t.amount < 0)
                                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

                                return (
                                    <SortableBudgetItem
                                        key={budget.categoryId}
                                        budget={budget}
                                        spent={totalSpent}
                                        onProgressBarClick={handleProgressBarClick}
                                        onEdit={() => {
                                            setSelectedBudget(budget);
                                            setEditBudgetModalOpen(true);
                                        }}
                                        onDelete={removeBudget}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>

        <BaseModal
            title="Přidat nový rozpočet"
            isOpen={isAddBudgetModalOpen}
            onClose={() => setAddBudgetModalOpen(false)}
        >
            <AddBudgetModal 
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
                    onCancel={() => setEditBudgetModalOpen(false)}
                />
            )}
        </BaseModal>
        </>
    );
}
