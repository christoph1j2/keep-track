import { CategoryIcon } from "../Base/CategoryIcon";
import type { Transaction } from "../../types/transaction";
import { useCategories } from "../../hooks/useCategories";

/**
 * Renders the newest transactions first and keeps the list short enough to scan quickly.
 *
 * @param props.transactions Transactions to display.
 */
export function LastTransactions(
    { transactions }:
    { transactions: Transaction[] }
) {
    const { getCategoryById } = useCategories();

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Poslední transakce</h3>
            <div className="flex flex-col gap-1">
                {[...transactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0,5)
                .map((t) => {
                    const category = getCategoryById(t.categoryId)
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

                {transactions.length === 0 && (
                    <div className="text-center text-slate-400 py-4 italic">
                        Zatím žádné transakce. :-)
                    </div>
                )}
            </div>
        </section>
    );
}