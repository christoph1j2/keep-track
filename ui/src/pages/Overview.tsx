import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { CategoryTree } from "../components/Overview/CategoryTree";
import { TransactionDataGrid } from "../components/Overview/TransactionDataGrid";
import { BaseModal } from "../components/Modals/BaseModal";
import { AddTransactionModal } from "../components/Modals/AddTransactionModal";
import { SplitTransactionModal } from "../components/Modals/SplitTransactionModal";
import { ImportModal } from "../components/Modals/ImportModal";
import { UNCATEGORIZED_ID } from "../constants/categoryConstants";

/**
 * Overview page for browsing, filtering, and editing transactions.
 * This page coordinates category filtering, grid editing, and modal-driven create/split flows.
 */
export function Overview() {
    const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
    const { categories } = useCategories();
    const location = useLocation();

    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
    const [isSplitTransactionModalOpen, setIsSplitTransactionModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[0] | null>(null);

    // Get initial category from navigation state, otherwise null
    const initialCategoryId = (location.state as { selectedCategoryId: string } | null)?.selectedCategoryId || null;
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId);

    //  filtrovane transakce pro datagrid
    const filteredTransactions = selectedCategoryId
        ? transactions.filter((t) => {
            // zjistit, zda kategorie u transakce existuje, pokud ne, přiřadit ji do UNCATEGORIZED
            const catExists = categories.some(c => c.id === t.categoryId);
            const effectiveCatId = catExists ? t.categoryId : UNCATEGORIZED_ID;

            const selected = categories.find(c => c.id === selectedCategoryId);
            if (!selected) return false;

            if (!selected.parentId) {
                const subcatIds = categories
                    .filter(c => c.parentId === selectedCategoryId)
                    .map(c => c.id);

                return effectiveCatId === selectedCategoryId || subcatIds.includes(effectiveCatId);
            }
            return effectiveCatId === selectedCategoryId;
        })
        : transactions;

    return (
        <div className="lg:h-full flex flex-col">
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 items-center text-center">
                <h2 className="text-3xl font-bold text-slate-800">Přehled transakcí</h2>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium w-full md:w-fit"
                    onClick={() => setIsImportModalOpen(true)}
                    >
                        + Import z banky
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full md:w-fit"
                    onClick={() => setIsAddTransactionModalOpen(true)}
                    >
                        + Nová transakce
                    </button>
                </div>
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
                        onSplitTransaction={(transaction) => {
                            setSelectedTransaction(transaction);
                            setIsSplitTransactionModalOpen(true);
                        }}
                    />
                </div>
            </div>

            <BaseModal
                title="Přidat novou transakci"
                isOpen={isAddTransactionModalOpen}
                onClose={()=>setIsAddTransactionModalOpen(false)}
            >
                <AddTransactionModal 
                    onSubmit={(title,amount,categoryId)=>{
                        addTransaction({
                            id: crypto.randomUUID(),
                            title,
                            amount,
                            categoryId,
                            date: new Date().toISOString()
                         });
                        setIsAddTransactionModalOpen(false)
                    }}
                    onCancel={()=>setIsAddTransactionModalOpen(false)}
                />
            </BaseModal>

            <BaseModal
                title="Rozdělit transakci"
                isOpen={isSplitTransactionModalOpen}
                onClose={()=>setIsSplitTransactionModalOpen(false)}
            >
                {selectedTransaction && (
                    <SplitTransactionModal
                        transaction={selectedTransaction}
                        onSubmit={(titles, amounts, categoryIds, date) => {
                            for (let i = 0; i < titles.length; i++) {
                                const newTransaction = {
                                    id: crypto.randomUUID(),
                                    title: titles[i],
                                    amount: amounts[i],
                                    categoryId: categoryIds[i],
                                    date: date
                                };
                                addTransaction(newTransaction);
                            }
                            deleteTransaction(selectedTransaction.id);
                            setIsSplitTransactionModalOpen(false);
                        }}
                        onCancel={() => setIsSplitTransactionModalOpen(false)}
                    />
                )}
            </BaseModal>

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />
        </div>
    );
}