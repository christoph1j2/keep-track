import { useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { CategoryTree } from "../components/Overview/CategoryTree";
import { TransactionDataGrid } from "../components/Overview/TransactionDataGrid";

export function Overview() {
    const { transactions } = useTransactions();
    const { categories } = useCategories();

    // dbug
    {console.log(transactions)}

    // pamet co uzivatel zaklikl ve stromu
    // na zacatku (null) neni vybrano nic = ukazujeme vse
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    //  filtrovane transakce pro datagrid
    const filteredTransactions = selectedCategoryId
        ? transactions.filter((t) => {
            //console.log("Filtering transaction", t.id, "with category", t.categoryId, "against selected category", selectedCategoryId);
            return t.categoryId === selectedCategoryId;
        })
        : transactions;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-800">Přehled transakcí</h2>
                {/* tlačítko na import CSV nebo ruční přidání */}
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    + Nová transakce
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-0 lg:col-span-3 flex flex-col overflow-hidden">
                    <TransactionDataGrid 
                        transactions={filteredTransactions}
                    />
                </div>
            </div>
        </div>
    );
}