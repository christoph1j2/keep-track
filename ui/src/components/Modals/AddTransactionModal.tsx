import { useState } from "react";
import { Select, MenuItem, TextField } from "@mui/material";
import { useTransactionStore } from "../../store/transactionStore";
import { useCategoryStore } from "../../store/categoryStore";
import { useTranslation } from "react-i18next";

interface AddTransactionModalProps {
    onCancel: () => void;
}

/**
 * Form used to create a single transaction.
 * Keeps the current validation rules local to the modal so the caller only handles successful submits and cancel.
 *
 * @param props.onSubmit Called with a valid title, amount, and category id.
 * @param props.onCancel Called when the user closes the form without saving.
 */
export function AddTransactionModal({ onCancel }: AddTransactionModalProps) {
    // <-- Přesunuto nahoru, abychom t() mohli používat i uvnitř handleSubmit
    const { t } = useTranslation(); 
    
    const categories = useCategoryStore((state) => state.categories);
    const addTransaction = useTransactionStore((state) => state.addTransaction);
    
    // stavy pro formular
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState<number | "">("");
    const [categoryId, setCategoryId] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[] | null>(null);

    /**
     * Validates the form and submits a new transaction when everything is filled in correctly.
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // zabrani refreshi po odeslani formulare

        if (isSubmitting) return; // zabrani dvojitemu odeslani
        setIsSubmitting(true);
        setErrors(null);

        // validace s využitím překladů
        if (!title.trim() || amount === "" || !categoryId) {
            setErrors([t('transactions.errors.missingFields')]);
            setIsSubmitting(false);
            return;
        }
        if (amount === 0) {
            setErrors([t('transactions.errors.zeroAmount')]);
            setIsSubmitting(false);
            return;
        }
        if (!Number.isFinite(Number(amount))) {
            setErrors([t('transactions.errors.notANumber')]);
            setIsSubmitting(false);
            return;
        }

        addTransaction({
            title: title.trim(),
            amount: amount as number,
            categoryId,
            date: new Date().toISOString(),
        });

        setIsSubmitting(false);
        onCancel();
    };

    return (
        <>
        {errors && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-900/50 dark:text-red-200" role="alert" aria-live="assertive">
                {errors.map((error, idx) => (
                    <p key={idx}>{error}</p>
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {/* nazev */}
            <div className="flex flex-col gap-1">
                {/* <-- Přidáno dark:text-slate-300 */}
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.name')}</label>
                <TextField
                    fullWidth
                    size="small"
                    type="text"
                    placeholder={t('transactions.placeholders.title')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* castka */}
            <div className="flex flex-col gap-1">
                {/* <-- Přidáno dark:text-slate-300 */}
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.amount')}</label>
                <TextField
                    fullWidth
                    size="small"
                    type="number"
                    placeholder={t('transactions.placeholders.amount')}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
                />
                <span className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                    {t('transactions.tip')}
                </span>
            </div>

            {/* kategorie */}
            <div className="flex flex-col gap-1">
                {/* <-- Přidáno dark:text-slate-300 */}
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.category')}</label>
                <Select
                    fullWidth
                    size="small"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    renderValue={(selected) => {
                        if (!selected) return t('common.chooseCategory');
                        return categories.find(c => c.id === selected)?.label || t('common.unknownCategory');
                    }}
                >
                    {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                            {category.label}
                        </MenuItem>
                    ))}
                </Select>
            </div>

            {/* tlacitka */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                >
                    {t('common.cancel')}
                </button>
                <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                    {t('transactions.modalAdd')}
                </button>
            </div>
        </form>
        </>
    )
}