import { useMemo, useState } from "react";
import type { QuickAddTemplate } from "../../types/quickadd";
import { Select, MenuItem, TextField } from "@mui/material";
import { useCategoryStore } from "../../store/categoryStore";
import { useTemplateStore } from "../../store/quickAddTemplateStore";

interface QuickAddTemplateModalProps {
    template?: QuickAddTemplate | null;
    onCancel: () => void;
}

/**
 * Form used to create or edit a quick add template.
 * Pre-fills with existing template data if provided, otherwise initializes with defaults.
 * Validates that title, amount, and category are provided.
 *
 * @param props.template Existing template to edit, or undefined/null to create a new one.
 * @param props.onSubmit Called with the template data (excluding id) when form is valid.
 * @param props.onCancel Called when the user closes the form without saving.
 */
export function QuickAddTemplateModal({ template, onCancel }: QuickAddTemplateModalProps) {
    const categories = useCategoryStore((state) => state.categories);
    const sortedCategories = useMemo(
        () => categories,
        [categories]
    );

    const addTemplate = useTemplateStore((state) => state.addTemplate);

    const [title, setTitle] = useState(template?.title ?? "");
    const [amount, setAmount] = useState<number | "">(template?.amount ?? "");
    const [categoryId, setCategoryId] = useState(template?.categoryId ?? sortedCategories[0]?.id ?? "");
    const [showInHotbar] = useState(template?.showInHotbar ?? false);
    const [errors, setErrors] = useState<string[] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (event: React.SubmitEvent) => {
        event.preventDefault();

        if (isSubmitting) return; // zabrani dvojitemu odeslani
        setIsSubmitting(true);
        setErrors(null);

        if (!title.trim() || amount === "" || !categoryId) {
            setErrors(["Vyplňte název, částku a kategorii."]);
            setIsSubmitting(false);
            return;
        }

        if (!Number.isFinite(amount) || amount === 0) {
            setErrors(["Částka musí být nenulové číslo."]);
            setIsSubmitting(false);
            return;
        }

        addTemplate({
            id: template?.id ?? crypto.randomUUID(),
            title: title.trim(),
            amount,
            categoryId,
            showInHotbar,
        });
        setIsSubmitting(false);
        onCancel();
        // onSubmit({
        //     title: title.trim(),
        //     amount,
        //     categoryId,
        //     showInHotbar,
        // });
    };

    return (
        <>
            {errors && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded" role="alert" aria-live="assertive">
                    {errors.map((error, index) => (
                        <p key={index}>{error}</p>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Název</label>
                    <TextField
                        fullWidth
                        size="small"
                        type="text"
                        placeholder="Např. Káva"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Částka</label>
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="Např. -59 nebo 5000"
                        slotProps={{ htmlInput: { step: "0.01" } }}
                        value={amount}
                        onChange={(event) => setAmount(event.target.value ? parseFloat(event.target.value) : "")}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Kategorie</label>
                    <Select
                        fullWidth
                        size="small"
                        value={categoryId}
                        onChange={(event) => setCategoryId(event.target.value)}
                    >
                        {sortedCategories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                                {category.label}
                            </MenuItem>
                        ))}
                    </Select>
                </div>

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
                        Uložit šablonu
                    </button>
                </div>
            </form>
        </>
    );
}
