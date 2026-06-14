import { CategoryIcon } from "../Base/CategoryIcon";
import { useState } from "react";
import { useTransactionStore } from "../../store/transactionStore";
import { useCategoryStore } from "../../store/categoryStore";

/**
 * Shows the five most recent transactions sorted by date.
 * This widget stays intentionally compact to keep the dashboard scannable.
 *
 * @param props.transactions Transactions to display.
 */
export function LastTransactions() {
    const categories = useCategoryStore((state) => state.categories);
    const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');

    const transactions = useTransactionStore((state) => state.transactions);

    const filteredTransactions = transactions.filter(t => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'income') return t.amount >= 0;
        if (activeFilter === 'expense') return t.amount < 0;
        return true;
    });

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Poslední transakce</h3>
                <div className="w-full lg:w-fit flex items-center overflow-hidden rounded-lg text-sm bg-slate-100">
                    <button 
                        className={`w-full text-sm text-slate-600 hover:text-slate-700 hover:bg-slate-300 py-1 px-2 transition-colors rounded-l-lg ${activeFilter === 'all' ? 'bg-slate-300 text-slate-600' : ''}`} 
                        value="all"
                        onClick={() => setActiveFilter('all')}
                    >Vše</button>
                    <button 
                        className={`w-full text-sm text-slate-600 hover:text-slate-700 hover:bg-slate-300 py-1 px-2 transition-colors ${activeFilter === 'income' ? 'bg-slate-300 text-slate-600' : ''}`} 
                        value="income"
                        onClick={() => setActiveFilter('income')}
                    >Příjmy</button>
                    <button 
                        className={`w-full text-sm text-slate-600 hover:text-slate-700 hover:bg-slate-300 py-1 px-2 transition-colors rounded-r-lg ${activeFilter === 'expense' ? 'bg-slate-300 text-slate-600' : ''}`} 
                        value="expense"
                        onClick={() => setActiveFilter('expense')}
                    >Výdaje</button>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                {[...filteredTransactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0,10)
                .map((t) => {
                    const category = categories.find((c) => c.id === t.categoryId);
                    return (
                    <div
                        key={t.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-200 rounded-lg border border-transparent hover:border-slate-100 transition-colors"
                    >
                        {/** nazev, ikonka a datum */}
                        <div className="flex items-center">
                            <div className={`p-1 rounded-lg ${category != undefined ? category.colorClass : 'bg-gray-200 text-gray-600'}`}>
                                <CategoryIcon name={category != undefined ? category.iconName : ''} />
                            </div>
                            <div className="ml-3 flex flex-col">
                            <span className="font-semibold text-slate-700">{t.title}</span>
                            <span className="text-xs text-slate-400">
                                {new Date(t.date).toLocaleDateString('cs-CZ')}
                            </span>
                            </div>
                        </div>
                        {/** castka */}
                        <span className={`font-medium ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {t.amount.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}
                        </span>
                    </div>
                    )
                    }
                    )
                }

                {filteredTransactions.length === 0 && (
                    <div className="text-center text-slate-400 py-4 italic">
                        Zatím žádné transakce. :-)
                    </div>
                )}
            </div>
        </section>
    );
}