import { useState, useMemo } from "react";
import type { Transaction } from "../../types/transaction";
import { CategoryIcon } from "../Base/CategoryIcon";
import { useCategoryStore } from "../../store/categoryStore";
import { useConfirmStore } from "../../store/confirmStore";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/formatCurrency";

interface TransactionMobileListProps {
    transactions: Transaction[];
    onUpdateTransaction: (updated: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
    onSplitTransaction: (transaction: Transaction) => void;
}

// pocet polozek na jedne strance
const ITEMS_PER_PAGE = 5;

/**
 * Mobile transaction list with pagination and inline editing.
 * The component mirrors core desktop actions: update, split, and delete.
 *
 * @param props.transactions Transactions to render.
 * @param props.onUpdateTransaction Called after a confirmed edit.
 * @param props.onDeleteTransaction Called after delete confirmation.
 * @param props.onSplitTransaction Called when a row is sent to split flow.
 */
export function TransactionMobileList({ transactions, onUpdateTransaction, onDeleteTransaction, onSplitTransaction }: TransactionMobileListProps) {
    // hook pro ziskani kategorii a jejich detailu
    const categories = useCategoryStore((state) => state.categories);
    const lineClass = "border-slate-200/70 dark:border-slate-700/40";

    // id transakce, kterou editujeme
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // data zmenenych poli v editovane transakci
    const [editingData, setEditingData] = useState<Partial<Transaction>>({});
    
    // aktualni stranka pro paginaci
    const [page, setPage] = useState(0);

    const { t } = useTranslation();
    const showConfirm = useConfirmStore((state) => state.showConfirm);


    const filteredTransactions = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) return transactions;

        return transactions.filter((transaction) =>
            transaction.title.toLowerCase().includes(normalizedSearch)
        );
    }, [transactions, searchTerm]);

    const sortedTransactions = useMemo(() => {
        return [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredTransactions]);


    // vypocet transakcí pro aktualni stranku
    const paginatedTransactions = useMemo(() => {
        const start = page * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return sortedTransactions.slice(start, end);
    }, [sortedTransactions, page]);

    // celkovy pocet stranek
    const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE));

    /**
     * Opens inline edit mode for a row.
     *
     * @param transaction Transaction selected for editing.
     */
    const handleEdit = (transaction: Transaction) => {
        setEditingId(transaction.id);
        setEditingData(transaction);
    };

    /**
     * Validates and persists row edits after user confirmation.
     *
     * @param transaction Original row used as the base of the update.
     */
    const handleSave = (transaction: Transaction) => {
        const newRow = { ...transaction, ...editingData };
        
        // validace - castka musi byt cislo, nesmi byt nula
        const amount = parseFloat(newRow.amount as unknown as string);
        if (isNaN(amount)) {
            alert(t('overview.confirm.invalidNumber'));
            return;
        }
        if (amount === 0) {
            alert(t('overview.confirm.zeroAmount'));
            return;
        }
        newRow.amount = amount;

        // potvrzeni od uzivatele pred ulozenim
        showConfirm(
            t('common.warning'),
            t('overview.confirm.saveChanges'),
            () => {
                onUpdateTransaction(newRow);
                setEditingId(null);
                setEditingData({});
            }
        );
    };

    /**
     * Leaves edit mode and clears any draft values.
     */
    const handleCancel = () => {
        setEditingId(null);
        setEditingData({});
    };

    return (
        <div className="flex flex-col h-full bg-white text-slate-900 dark:bg-slate-950 rounded-lg dark:text-slate-100 transition-colors duration-200">
            <div className="px-2 pt-2 pb-1">
                <input
                    type="search"
                    placeholder={t('overview.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(0);
                    }}
                    className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
                />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 px-2 py-2">
                {/* seznam transakcí na aktualni strance */}
                {paginatedTransactions.length === 0 ? (
                    <div className={`border ${lineClass} rounded-lg p-4 text-center text-sm text-slate-500 dark:text-slate-400`}>
                        {t('overview.noTransactions')}
                    </div>
                ) : paginatedTransactions.map((transaction) => {
                    const category = categories.find(c => c.id === transaction.categoryId);
                    const isEditing = editingId === transaction.id;
                    const current = { ...transaction, ...editingData };

                    return (
                        <div
                            key={transaction.id}
                            className={`border ${lineClass} rounded-lg p-3 bg-white dark:bg-slate-900/70 shadow-none transition-colors`}
                        >
                            {isEditing ? (
                                // rezim editace - zobrazeni formulare
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('overview.columns.title')}</label>
                                        <input
                                            type="text"
                                            value={current.title}
                                            onChange={(e) =>
                                                setEditingData({ ...editingData, title: e.target.value })
                                            }
                                            className={`w-full px-2 py-1 border ${lineClass} rounded text-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500`}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('overview.columns.amount')}</label>
                                        <input
                                            type="number"
                                            value={current.amount}
                                            onChange={(e) =>
                                                setEditingData({
                                                    ...editingData,
                                                    amount: parseFloat(e.target.value),
                                                })
                                            }
                                            className={`w-full px-2 py-1 border ${lineClass} rounded text-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500`}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('overview.columns.category')}</label>
                                        <select
                                            value={current.categoryId}
                                            onChange={(e) =>
                                                setEditingData({ ...editingData, categoryId: e.target.value })
                                            }
                                            className={`w-full px-2 py-1 border ${lineClass} rounded text-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500`}
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* tlacitka pro ulozeni nebo zruseni editace */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => handleSave(transaction)}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded text-sm font-semibold transition-colors"
                                        >
                                            {t('common.save')}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 px-2 py-1 rounded text-sm font-semibold transition-colors"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => {
                                                onSplitTransaction(transaction);
                                            }}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-sm font-semibold transition-colors"
                                        >
                                            {t('overview.columns.split')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                showConfirm(
                                                    t('common.warning'),
                                                    t('overview.confirm.delete'),
                                                    () => {
                                                        onDeleteTransaction(transaction.id as string);
                                                    }
                                                );
                                            }}
                                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded text-sm font-semibold transition-colors"
                                        >
                                            {t('overview.columns.delete')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // rezim zobrazeni - zobrazeni dat, klik zahajuje editaci
                                <div onClick={() => handleEdit(transaction)} className="cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <CategoryIcon name={category?.iconName || ""} />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200" title={transaction.title}>{transaction.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(transaction.date).toLocaleDateString("cs-CZ")}
                                                </p>
                                            </div>
                                        </div>
                                        {/* castka s barevnym odlisenim pro prijem/vydaj */}
                                        <p
                                            className={`font-semibold text-sm shrink-0 ml-2 ${
                                                transaction.amount >= 0
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-rose-600 dark:text-rose-400"
                                            }`}
                                        >
                                            {formatCurrency(transaction.amount)}
                                        </p>
                                    </div>

                                    {/* badge s kategorii */}
                                    <div
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                            category?.colorClass ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                        }`}
                                    >
                                        <CategoryIcon name={category?.iconName || ""} />
                                        <span>{category?.label || "Nepřiřazeno"}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* paginace - tlacitka pro navigaci mezi strankami */}
            <div className={`flex items-center justify-between my-4 px-2 mt-auto border-t ${lineClass} pt-4`}>
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {t('overview.pagination.previous')}
                </button>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                    {t('overview.pagination.pageInfo', { current: page + 1, total: totalPages })}
                </span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="px-3 py-1 rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {t('overview.pagination.next')}
                </button>
            </div>
        </div>
    );
}
