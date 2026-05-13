import { useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { CategoryTree } from "../components/Overview/CategoryTree";
import { TransactionDataGrid } from "../components/Overview/TransactionDataGrid";
import { BaseModal } from "../components/Modals/BaseModal";
import { TransactionModal } from "../components/Modals/TransactionModal";

export function Overview() {
    const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
    const { categories } = useCategories();

    const [isModalOpen, setIsModalOpen] = useState(false);

    // dbug
    {console.log(transactions)}

    // pamet co uzivatel zaklikl ve stromu
    // na zacatku (null) neni vybrano nic = ukazujeme vse
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    //  filtrovane transakce pro datagrid
    const filteredTransactions = selectedCategoryId
        ? transactions.filter((t) => {
            const selected = categories.find(c => c.id === selectedCategoryId);
            if (!selected) return false;

            if (!selected.parentId) {
                const subcatIds = categories
                    .filter(c => c.parentId === selectedCategoryId)
                    .map(c => c.id);
                return t.categoryId === selectedCategoryId || subcatIds.includes(t.categoryId);
            }
            return t.categoryId === selectedCategoryId;
        })
        : transactions;

    return (
        <div className="lg:h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-800">Přehled transakcí</h2>
                {/* tlačítko na import CSV nebo ruční přidání */}
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={() => setIsModalOpen(true)}
                >
                    + Nová transakce
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:flex-1 lg:min-h-0">
                {/** TREE VIEW, KATEGORIE */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:col-span-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xl font-bold text-slate-700 mb-4 px-2">Kategorie</h3>
                    {selectedCategoryId && (
                        <button 
                            onClick={() => setSelectedCategoryId(null)}
                            className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                            Zrušit filtr
                        </button>
                    )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <CategoryTree
                            categories={categories}
                            // ulozi se do state, ktery je v Overview, protoze ho potrebuje i DataGrid
                            onSelectCategory={setSelectedCategoryId}
                        />
                    </div>
                </div>

                {/** DATA GRID */}
                <div className="bg-white rounded-2xl lg:shadow-sm border border-slate-100 p-0 lg:col-span-3 lg:flex lg:flex-col lg:overflow-hidden min-h-106">

                    <TransactionDataGrid 
                        transactions={filteredTransactions}
                        onUpdateTransaction={updateTransaction}
                        onDeleteTransaction={deleteTransaction}
                    />
                </div>
            </div>

            <BaseModal
                title="Přidat novou transakci"
                isOpen={isModalOpen}
                onClose={()=>setIsModalOpen(false)}
            >
                <TransactionModal 
                    onSubmit={(title,amount,categoryId)=>{
                        addTransaction({
                            id: crypto.randomUUID(),
                            title,
                            amount,
                            categoryId,
                            date: new Date().toISOString()
                         });
                        setIsModalOpen(false) // zavreme modal po submitu
                    }}
                    onCancel={()=>setIsModalOpen(false)}
                />
            </BaseModal>
        </div>
    );
}