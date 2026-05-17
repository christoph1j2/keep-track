import { MenuItem, Select } from "@mui/material";
import {useState} from "react";
import { useCategories } from "../../hooks/useCategories";

interface AddBudgetModalProps {
    onSubmit: (categoryId: string, limit: number) => void;
    onCancel: () => void;
}

/**
 * Form used to create a new budget for a category.
 * Validates that a category is selected and the limit is a positive number.
 *
 * @param props.onSubmit Called with the selected category id and limit amount when form is valid.
 * @param props.onCancel Called when the user closes the form without saving.
 */
export function AddBudgetModal({ onSubmit, onCancel }: AddBudgetModalProps) {

    const {categories} = useCategories();

    // stavy pro formular
    const [categoryId, setCategoryId] = useState("");
    const [limit, setLimit] = useState<number | "">("");
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

        onSubmit(categoryId, limit);
    };

    return (
        <>
        {errors && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {errors.map((err, i) => (
                    <p key={i}>{err}</p>
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label htmlFor="parentId">Kategorie:</label>
                <Select
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
                <label htmlFor="limit">Limit (CZK):</label>
                <input
                    id="limit"
                    type="number"
                    placeholder="Např. 5000"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value === "" ? "" : Number(e.target.value))}
                    className="p-2 border border-slate-400 rounded-md"
                />
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                    Zrušit
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Přidat rozpočet
                </button>
            </div>
        </form>
        </>
    );
}