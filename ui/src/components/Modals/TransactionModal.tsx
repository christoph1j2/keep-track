import { useState } from "react";
import { useCategories } from "../../hooks/useCategories";

interface TransactionModalProps {
    onSubmit: (title: string, amount: number, categoryId: string) => void;
    onCancel: () => void;
}

export function TransactionModal({ onSubmit, onCancel }: TransactionModalProps) {
    const {categories} = useCategories();

    // stavy pro formular
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState<number | "">("");
    const [categoryId, setCategoryId] = useState("");

    const [errors, setErrors] = useState<string[] | null>(null);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault(); // zabrani refreshi po odeslani formulare

        // validace
        if (!title || amount === "" || !categoryId) {
            setErrors(["Vyplňte všechny pole"]);
            return;
        }
        if (amount === 0) {
            setErrors(["Částka nemůže být nula"]);
            return;
        }
        if (isNaN(amount)) {
            setErrors(["Částka musí být číslo"]);
            return;
        }

        onSubmit(title, amount, categoryId);
        setErrors(null);
    };

    return (
        <>
        {errors && (
            <div>
                <strong className="text-red-500">{errors.join(",\n")}</strong>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {/* nazev */}
            <div className="flex flex-col gap-1">
                <label htmlFor="title">Název:</label>
                <input
                    id="title"
                    type="text"
                    placeholder="Např. Benzin ONO"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="p-2 border border-slate-400 rounded-md"
                />
            </div>

            {/* castka */}
            <div className="flex flex-col gap-1">
                <label htmlFor="amount">Částka:</label>
                <input
                    id="amount"
                    type="number"
                    placeholder="Např. -1000 (výdaj) nebo 5000 (příjem)"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
                className="p-2 border border-slate-400 rounded-md"
            />
            </div>

            {/* kategorie */}
            <div className="flex flex-col gap-1">
                <label htmlFor="categoryId">Kategorie:</label>
                <select
                    id="categoryId"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="p-2 border border-slate-400 rounded-md"
                    required
                >
                    <option value="" hidden disabled>
                        Vyberte kategorii
                    </option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.label}
                        </option>
                    ))}
                </select>
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