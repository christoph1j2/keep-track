import { useState } from "react";
import { useCategoryStore } from "../../store/categoryStore";
import { Select, MenuItem, TextField } from "@mui/material";
import type { Transaction } from "../../types/transaction";

interface SplitTransactionModalProps {
    transaction: Transaction;
    onSubmit: (titles: string[], amounts: number[], categoryIds: string[], date: string) => void;
    onCancel: () => void;
}

type SplitRow = {
    title: string;
    amount: string;
    categoryId: string;
}

/**
 * Form used to split one transaction into several smaller ones.
 * It keeps the current balance check inside the modal so the caller only receives a valid set of split rows.
 *
 * @param props.transaction Transaction being split.
 * @param props.onSubmit Called with matching title, amount, and category arrays once the split balances.
 * @param props.onCancel Called when the user leaves the split flow.
 */
export function SplitTransactionModal({ transaction, onSubmit, onCancel }: SplitTransactionModalProps) {
    const categories = useCategoryStore((state) => state.categories);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[] | null>(null);

    const [splits, setSplits] = useState<SplitRow[]>([
        { title: "", amount: "", categoryId: "" },
        { title: "", amount: "", categoryId: "" },
    ]);

    // pocita s absolutnimi hodnotami, uzivatel zadava kladne castky a my aplikujeme puvodni znamenko az pri odesilani, aby bylo jednodussi kontrolovat zbylej zustatek a validovat nezaporne zadane castky
    const absoluteTransactionAmount = Math.abs(transaction.amount);
    const remaining = absoluteTransactionAmount - splits.reduce((sum, split) => {
        const val = Number(split.amount);
        return sum + (isNaN(val) ? 0 : Math.abs(val));
    }, 0);


    /**
     * Validates all split rows and submits them only when the total matches the original transaction.
     * Users enter positive values; we apply the original sign at submission.
     */
    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault(); // zabrani refreshi po odeslani formulare

        if (isSubmitting) return; // zabrani dvojitemu odeslani
        setIsSubmitting(true);
        setErrors(null);

        // validace
        const parsedAmounts = splits.map((split) => Number(split.amount));

        if (splits.some((split) => !split.title) || splits.some((split) => split.amount === "") || splits.some((split) => !split.categoryId)) {
            setErrors(["Vyplňte všechny pole"]);
            setIsSubmitting(false);
            return;
        }
        if (parsedAmounts.some(a => a === 0)) {
            setErrors(["Částka nemůže být nula"]);
            setIsSubmitting(false);
            return;
        }
        if (parsedAmounts.some(a => isNaN(a))) {
            setErrors(["Částka musí být číslo"]);
            setIsSubmitting(false);
            return;
        }
        if (parsedAmounts.some(a => a < 0)) {
            setErrors(["Zadejte prosím pouze kladné částky"]);
            setIsSubmitting(false);
            return;
        }
        if (remaining !== 0) {
            setErrors([`Částky nesouhlasí, zbývá ${remaining.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}`]);
            setIsSubmitting(false);
            return;
        }

        // aplikujeme puvodni znamenko k zadanym castkam, aby se odesilaly jako korektni rozdeleni (kladne i zaporne)
        const signedAmounts = parsedAmounts.map(amount => 
            transaction.amount < 0 ? -amount : amount
        );

        onSubmit(splits.map((split) => split.title), signedAmounts, splits.map((split) => split.categoryId),transaction.date);
    }


    return (
        <>
        <hr className="border-slate-100 dark:border-slate-800" />
        {errors && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-500/10 dark:text-red-200" role="alert" aria-live="assertive">
                {errors.map((error, idx) => (
                    <p key={idx}>{error}</p>
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div>
                <span>
                    Rozdělení transakce <strong>"{transaction.title}"</strong>,
                </span> <br />
                <span>
                    V kategorii <strong>"{categories.find(c => c.id === transaction.categoryId)?.label || 'Neznámá'}"</strong>, <br />
                </span>
                <span>
                    K rozdělení zbývá <strong>{remaining.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' })}</strong>
                </span>
            </div>
            {/* vezme vsechny split polozky a postavi je dle indexu */}
            {splits.map((split, index) => (
                <div 
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:grid-cols-3 sm:items-end"
                >
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Název</label>
                        <TextField
                            size="small"
                            type="text"
                            placeholder="Benzin ONO"
                            value={split.title}
                            onChange={(e) => {
                                const newSplits = [...splits];
                                newSplits[index].title = e.target.value;
                                setSplits(newSplits);
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Částka</label>
                        <TextField
                            size="small"
                            type="number"
                            placeholder="Kladnou hodnotu!"
                            slotProps={{ htmlInput: { step: "0.01" } }}
                            value={split.amount}
                            onChange={(e) => {
                                const newSplits = [...splits];
                                newSplits[index].amount = e.target.value;
                                setSplits(newSplits);
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Kategorie</label>
                        <Select
                            size="small"
                            value={split.categoryId}
                        onChange={(e) => {
                            const newSplits = [...splits];
                            newSplits[index].categoryId = e.target.value;
                            setSplits(newSplits);
                        }}
                    >
                        <MenuItem value="">Vyberte kategorii</MenuItem>
                        {categories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                                {category.label}
                            </MenuItem>
                        ))}
                    </Select>                    </div>                </div>
            ))}

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    {splits.length < 4 && (
                        <button
                            type="button"
                            onClick={() => setSplits([
                                ...splits,
                                { title: "", amount: "", categoryId: "" }
                            ])}
                            className="h-10 w-10 rounded-full border border-slate-400 dark:border-slate-700 text-2xl leading-none transition-colors hover:bg-slate-300 dark:hover:bg-slate-800"

                        >
                            +
                        </button>
                    )}

                    {splits.length > 2 && (
                        <button
                            type="button"
                            onClick={() => setSplits(splits.slice(0, -1))}
                            className="h-10 w-10 rounded-full border border-slate-400 dark:border-slate-700 text-2xl leading-none transition-colors hover:bg-slate-300 dark:hover:bg-slate-800"
                        >
                            -
                        </button>
                    )}
                </div>
                {/* tlacitka */}
                <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 sm:flex-row sm:gap-3 sm:border-t-0 sm:pt-0">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full rounded-lg px-4 py-2 font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"

                    >
                        Zrušit
                    </button>
                    <button 
                    type="submit"
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
                    >
                        Uložit rozdělení
                    </button>
                </div>
            </div>
        </form>
        </>
    )
}
