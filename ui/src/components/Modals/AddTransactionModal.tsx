import { useState } from "react";
import { useCategories } from "../../hooks/useCategories";
import { Select, MenuItem, TextField } from "@mui/material";
import { useTransactionStore } from "../../store/transactionStore";

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
    const {categories} = useCategories();

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
    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault(); // zabrani refreshi po odeslani formulare

        if (isSubmitting) return; // zabrani dvojitemu odeslani
        setIsSubmitting(true);
        setErrors(null);

        // validace
        if (!title || amount === "" || !categoryId) {
            setErrors(["Vyplňte všechny pole"]);
            setIsSubmitting(false);
            return;
        }
        if (amount === 0) {
            setErrors(["Částka nemůže být nula"]);
            setIsSubmitting(false);
            return;
        }
        if (isNaN(amount)) {
            setErrors(["Částka musí být číslo"]);
            setIsSubmitting(false);
            return;
        }

        addTransaction({
            title,
            amount: amount as number,
            categoryId,
            date: new Date().toISOString(),
        });
        // onSubmit(title, amount, categoryId);
    };

    return (
        <>
        {errors && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded" role="alert" aria-live="assertive">
                {errors.map((error, idx) => (
                    <p key={idx}>{error}</p>
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {/* nazev */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Název</label>
                <TextField
                    fullWidth
                    size="small"
                    type="text"
                    placeholder="Např. Benzin ONO"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* castka */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Částka</label>
                <TextField
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="Např. -1000 (výdaj) nebo 5000 (příjem)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
                />
                <span className="text-xs text-slate-500 mt-1">
                    Tip: Zadejte zápornou částku pro výdaj (např. -500) a kladnou pro příjem.
                </span>
            </div>

            {/* kategorie */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Kategorie</label>
                <Select
                    fullWidth
                    size="small"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    renderValue={(selected) => {
                        if (!selected) return "Vyberte kategorii";
                        return categories.find(c => c.id === selected)?.label || "Neznámá kategorie";
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
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                    Zrušit
                </button>
                <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                >
                    Uložit transakci
                </button>
            </div>
        </form>
        </>
    )
}