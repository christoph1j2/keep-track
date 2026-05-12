import { useState, useMemo } from "react";
import type { Transaction } from "../../types/transaction";
import { CategoryIcon } from "../Base/CategoryIcon";
import { useCategories } from "../../hooks/useCategories";

interface TransactionMobileListProps {
    transactions: Transaction[];
    onUpdateTransaction: (updated: Transaction) => void;
}

// pocet polozek na jedne strance
const ITEMS_PER_PAGE = 5;

/**
 * Mobile-friendly transaction list component with pagination and inline editing
 * @param {TransactionMobileListProps} props - Component props
 * @param {Transaction[]} props.transactions - Array of transactions to display
 * @param {Function} props.onUpdateTransaction - Callback function when a transaction is updated
 * @returns {JSX.Element} Rendered transaction list with pagination controls
 */
export function TransactionMobileList({ transactions, onUpdateTransaction }: TransactionMobileListProps) {
    // hook pro ziskani kategorii a jejich detailu
    const { getCategoryById, categories } = useCategories();
    
    // id transakce, kterou editujeme
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // data zmenenych poli v editovane transakci
    const [editingData, setEditingData] = useState<Partial<Transaction>>({});
    
    // aktualni stranka pro paginaci
    const [page, setPage] = useState(0);

    // vypocet transakcí pro aktualni stranku
    const paginatedTransactions = useMemo(() => {
        const start = page * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return transactions.slice(start, end);
    }, [transactions, page]);

    // celkovy pocet stranek
    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

    /**
     * Initiates editing mode for a transaction
     * @param {Transaction} transaction - The transaction to edit
     * @returns {void}
     */
    const handleEdit = (transaction: Transaction) => {
        setEditingId(transaction.id);
        setEditingData(transaction);
    };

    /**
     * Saves the updated transaction
     * @param {Transaction} transaction - The original transaction
     * @returns {void}
     */
    const handleSave = (transaction: Transaction) => {
        const newRow = { ...transaction, ...editingData };
        
        // validace - castka musi byt cislo, nesmi byt nula
        const amount = parseFloat(newRow.amount as unknown as string);
        if (isNaN(amount)) {
            alert("Castka musi byt platne cislo.");
            return;
        }
        if (amount === 0) {
            alert("Castka nesmi byt nula.");
            return;
        }
        newRow.amount = amount;

        // potvrzeni od uzivatele pred ulozenim
        const isConfirmed = window.confirm("Opravdu chcete ulozit zmeny?");
        if (isConfirmed) {
            onUpdateTransaction(newRow);
            setEditingId(null);
            setEditingData({});
        }
    };

    /**
     * Cancels the editing mode without saving changes
     * @returns {void}
     */
    const handleCancel = () => {
        setEditingId(null);
        setEditingData({});
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 ">
            <div className="flex-1 overflow-y-auto space-y-2">
                {/* seznam transakcí na aktualni strance */}
                {paginatedTransactions.map((transaction) => {
                    const category = getCategoryById(transaction.categoryId);
                    const isEditing = editingId === transaction.id;
                    const current = { ...transaction, ...editingData };

                    return (
                        <div
                            key={transaction.id}
                            className="border border-slate-200 rounded-lg p-3 bg-white shadow-none"
                        >
                            {isEditing ? (
                                // rezim editace - zobrazeni formulare
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Název</label>
                                        <input
                                            type="text"
                                            value={current.title}
                                            onChange={(e) =>
                                                setEditingData({ ...editingData, title: e.target.value })
                                            }
                                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Částka</label>
                                        <input
                                            type="number"
                                            value={current.amount}
                                            onChange={(e) =>
                                                setEditingData({
                                                    ...editingData,
                                                    amount: parseFloat(e.target.value),
                                                })
                                            }
                                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-600">Kategorie</label>
                                        <select
                                            value={current.categoryId}
                                            onChange={(e) =>
                                                setEditingData({ ...editingData, categoryId: e.target.value })
                                            }
                                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
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
                                            className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-sm font-semibold"
                                        >
                                            Uložit
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm font-semibold"
                                        >
                                            Zrušit
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // rezim zobrazeni - zobrazeni dat, klik zahajuje editaci
                                <div onClick={() => handleEdit(transaction)} className="cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 flex-1">
                                            <CategoryIcon name={category?.iconName || ""} />
                                            <div>
                                                <p className="font-semibold text-sm">{transaction.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(transaction.date).toLocaleDateString("cs-CZ")}
                                                </p>
                                            </div>
                                        </div>
                                        {/* castka s barevnym odlisenim pro prijem/vydaj */}
                                        <p
                                            className={`font-semibold text-sm ${
                                                transaction.amount >= 0
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {transaction.amount.toLocaleString("cs-CZ", {
                                                style: "currency",
                                                currency: "CZK",
                                            })}
                                        </p>
                                    </div>

                                    {/* badge s kategorii */}
                                    <div
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${category?.colorClass}-500 ${category?.colorClass}-100 text-xs`}
                                    >
                                        <CategoryIcon name={category?.iconName || ""} />
                                        <span>{category?.label || "Neprirazeno"}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* paginace - tlacitka pro navigaci mezi strankami */}
            <div className="flex items-center justify-between my-4 px-2 mt-auto border-t border-slate-200 pt-4">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 rounded bg-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ← Predchozi
                </button>
                <span className="text-xs text-gray-600">
                    Strana {page + 1} z {totalPages}
                </span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="px-3 py-1 rounded bg-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Dalsi →
                </button>
            </div>
        </div>
    );
}
