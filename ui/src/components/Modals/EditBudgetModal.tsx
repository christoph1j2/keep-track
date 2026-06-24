import { MenuItem, Select, TextField } from "@mui/material";
import { useState } from "react";
import type { Budget } from "../../types/budget";
import { useCategoryStore } from "../../store/categoryStore";
import { useBudgetStore } from "../../store/budgetStore";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

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
  // <-- Přesunuto na začátek, abychom t() mohli použít i ve funkcích
  const { t } = useTranslation();

  const categories = useCategoryStore((state) => state.categories);
  const updateBudget = useBudgetStore((state) => state.updateBudget);

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
          overflowY: "auto",
        },
      },
    },
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // zabrani refreshi po odeslani formulare

    if (isSubmitting) return; // zabrani dvojitemu odeslani
    setIsSubmitting(true);
    setErrors(null);

    // validace
    if (!categoryId || limit === "") {
      setErrors([t("budgeting.errors.missingFields")]); // <-- Překlad
      setIsSubmitting(false);
      return;
    }

    if (limit <= 0) {
      setErrors([t("budgeting.errors.positiveLimit")]); // <-- Překlad
      setIsSubmitting(false);
      return;
    }

    try {
      await updateBudget(budget.id, { categoryId, limit: Number(limit) });
      toast.success(t("budgeting.updated")); // <-- Přidáno toastové hlášení o úspěchu
    } catch (err) {
      console.error("Failed to update budget:", err);
      setErrors([t("budgeting.errors.updateFailed")]); // <-- Překlad
    } finally {
      setIsSubmitting(false);
      onCancel(); // zavre modal po uspesnem upraveni
    }
  };

  return (
    <>
      {errors && (
        <div
          className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-500/10 dark:text-red-200"
          role="alert"
          aria-live="assertive"
        >
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          {/* <-- Přidáno dark:text-slate-300 */}
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("common.category")}
          </label>
          <Select
            fullWidth
            value={categoryId || ""}
            size="small"
            onChange={(e) => setCategoryId(e.target.value)}
            MenuProps={MenuProps}
            renderValue={(selected) => {
              if (!selected) return t("common.none");
              return (
                categories.find((c) => c.id === selected)?.label ||
                t("common.unknownCategory")
              );
            }}
          >
            {/* <-- Překlad a sjednocení na 'common.none' */}
            <MenuItem value="">{t("common.none")}</MenuItem>
            {(() => {
              return categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.label}
                </MenuItem>
              ));
            })()}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          {/* <-- Přidáno dark:text-slate-300 */}
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("budgeting.limit")}
          </label>
          <TextField
            fullWidth
            size="small"
            type="number"
            placeholder={t("budgeting.placeholder")}
            value={limit}
            onChange={(e) =>
              setLimit(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t("common.save")}
          </button>
        </div>
      </form>
    </>
  );
}
