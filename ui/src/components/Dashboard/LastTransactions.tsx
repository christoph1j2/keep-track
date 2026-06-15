import { CategoryIcon } from "../Base/CategoryIcon";
import { useState } from "react";
import { useTransactionStore } from "../../store/transactionStore";
import { useCategoryStore } from "../../store/categoryStore";

/**
 * Shows the ten most recent transactions sorted by date.
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
        <section className="bg-white p-6 rounded-2xl shadow-sm dark:bg-slate-900 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Poslední transakce</h3>
                <div className="w-full sm:w-auto flex items-center overflow-hidden rounded-lg text-sm bg-slate-100 dark:bg-slate-800 p-1">
                    <button 
                        className={`w-full sm:w-auto text-xs font-medium py-1.5 px-3 transition-colors rounded-md ${
                            activeFilter === 'all' 
                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' 
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`} 
                        onClick={() => setActiveFilter('all')}
                    >Vše</button>
                    <button 
                        className={`w-full sm:w-auto text-xs font-medium py-1.5 px-3 transition-colors rounded-md ${
                            activeFilter === 'income' 
                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' 
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`} 
                        onClick={() => setActiveFilter('income')}
                    >Příjmy</button>
                    <button 
                        className={`w-full sm:w-auto text-xs font-medium py-1.5 px-3 transition-colors rounded-md ${
                            activeFilter === 'expense' 
                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' 
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`} 
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
                        className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl border border-transparent transition-colors"
                    >
                        {/** nazev, ikonka a datum */}
                        <div className="flex items-center">
                            <div className={`p-2 rounded-xl flex items-center justify-center ${category !== undefined ? category.colorClass : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                <CategoryIcon name={category !== undefined ? category.iconName : ''} className="w-5 h-5" />
                            </div>
                            <div className="ml-3 flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                {t.title}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                {new Date(t.date).toLocaleDateString('cs-CZ')}
                            </span>
                            </div>
                        </div>
                        {/** castka */}
                        <span className={`font-semibold text-sm ${t.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}
                        </span>
                    </div>
                    )
                    }
                    )
                }

                {filteredTransactions.length === 0 && (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-8 text-sm italic">
                        Zatím žádné transakce. :-)
                    </div>
                )}
            </div>
        </section>
    );
}
