import { MenuItem, Select, TextField } from "@mui/material";
import { useState } from "react";
import { useCategoryStore } from "../../store/categoryStore";
import { useBudgetStore } from "../../store/budgetStore";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

interface AddBudgetModalProps {
  onCancel: () => void;
}

/**
 * Form used to create a new budget for a category.
 * Validates that a category is selected and the limit is a positive number.
 *
 * @param props.onSubmit Called with the selected category id and limit amount when form is valid.
 * @param props.onCancel Called when the user closes the form without saving.
 */
export function AddBudgetModal({ onCancel }: AddBudgetModalProps) {
  const { t } = useTranslation();

  const categories = useCategoryStore((state) => state.categories);
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");


  const { budgets, addBudget, updateBudget } = useBudgetStore();

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
    if (!categoryId || limit === "" || !Number.isFinite(limit)) {
      setErrors([t("budgeting.errors.missingFields")]); // <-- Přeloženo
      setIsSubmitting(false);
      return;
    }

    if (limit <= 0) {
      setErrors([t("budgeting.errors.positiveLimit")]); // <-- Přeloženo
      setIsSubmitting(false);
      return;
    }

    if (isNaN(limit)) {
      setErrors([t("budgeting.errors.invalidLimit")]); // <-- Přeloženo
      setIsSubmitting(false);
      return;
    }

    try {
      if (budgets.some((b) => b.categoryId === categoryId)) {
        const budget = budgets.find((b) => b.categoryId === categoryId);
        await updateBudget(
          budget!.id, { categoryId, limit: Number(limit) }
        );
        toast.success(t("budgeting.updated"));
        onCancel(); // zavre modal po uspesnem pridani
        return;
      }

      await addBudget({
        categoryId,
        limit: Number(limit),
        order: budgets.length,
      });
      toast.success(t("budgeting.added"));
      onCancel(); // zavre modal po uspesnem pridani
    } catch (err) {
      console.error("Failed to add budget:", err);
      setErrors([t("budgeting.errors.addFailed")]); // <-- Přeloženo
    } finally {
      setIsSubmitting(false);
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
          {/* <-- Přidáno dark:text-slate-300 a opraven klíč */}
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
              if (!selected) return t("common.none"); // <-- Přeloženo
              return (
                categories.find((c) => c.id === selected)?.label ||
                t("common.unknownCategory")
              ); // <-- Přeloženo
            }}
          >
            <MenuItem value="">{t("common.none")}</MenuItem>
            {(() => {
              return expenseCategories.map((cat) => (
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
            onChange={(e) => {
              if (e.target.value === "") {
                setLimit("");
                return;
              }
              const parsed = Number(e.target.value);
              setLimit(Number.isFinite(parsed) ? parsed : "");
            }}
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {t("common.add")}
          </button>
        </div>
      </form>
    </>
  );
}
