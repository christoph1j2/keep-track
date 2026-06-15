import { MenuItem, Select, TextField } from "@mui/material";
import { useState } from "react";
import type { Budget } from "../../types/budget";
import { useCategoryStore } from "../../store/categoryStore";
import { useBudgetStore } from "../../store/budgetStore";

interface EditBudgetModalProps {
    budget: Budget;
    onCancel: () => void;
}

/**
 * Form used to update an existing budget.
 * Pre-fills with the current budget values and validates that the limit is a positive number.
 *
 * @param props.budget Budget record to be edited.
 * @param props.onSubmit Called with the updated category id and limit when form is valid.
 * @param props.onCancel Called when the user closes the form without saving.
 */
export function EditBudgetModal({ budget, onCancel }: EditBudgetModalProps) {

    const categories = useCategoryStore((state) => state.categories);
    const setBudget = useBudgetStore((state) => state.setBudget);

    // stavy pro formular
    const [categoryId, setCategoryId] = useState(budget.categoryId);
    const [limit, setLimit] = useState<number | "">(budget.limit);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[] | null>(null);

    const MenuProps = {
        slotProps: {
            paper: {
                sx: {
                    maxHeight: 200,
                    overflowY: 'auto',
                },
            },
        },
    };

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault(); // zabrani refreshi po odeslani formulare

        if (isSubmitting) return; // zabrani dvojitemu odeslani
        setIsSubmitting(true);
        setErrors(null);

        // validace
        if (!categoryId || limit === "") {
            setErrors(["Vyplňte všechny pole"]);
            setIsSubmitting(false);
            return;
        }

        if (limit <= 0) {
            setErrors(["Limit musí být kladné číslo"]);
            setIsSubmitting(false);
            return;
        }

        setBudget(categoryId, limit);
        setIsSubmitting(false);
        onCancel(); // zavre modal po uspesnem upraveni

        // onSubmit(categoryId, limit);
    };

    return (
        <>
        {errors && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-500/10 dark:text-red-200" role="alert" aria-live="assertive">
                {errors.map((err, i) => (
                    <p key={i}>{err}</p>
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Kategorie</label>
                <Select
                    fullWidth
                    value={categoryId || ""}
                    size="small"
                    onChange={(e) => setCategoryId(e.target.value)}
                    MenuProps={MenuProps}
                    renderValue={(selected) => {
                        if (!selected) return "Žádná";
                        return categories.find(
                            c => c.id === selected)?.label 
                            || "Neznámá kategorie";
                    }}
                >
                    <MenuItem value="">Žádná</MenuItem>
                    {(() => {
                        return categories.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>
                                {cat.label}
                            </MenuItem>
                        ));
                    })()}
                </Select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Limit (CZK)</label>
                <TextField
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="Např. 5000"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value === "" ? "" : Number(e.target.value))}
                />
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                    Zrušit
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Upravit rozpočet
                </button>
            </div>
        </form>
        </>
    );
}
