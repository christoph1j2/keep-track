import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "../../store/budgetStore";
import { TextField } from "@mui/material";
import toast from "react-hot-toast";

interface EditComplexBudgetModalProps {
  onCancel: () => void;
}

export function EditComplexBudgetModal({ onCancel }: EditComplexBudgetModalProps) {
  const { t } = useTranslation();
  const { complexBudget, setComplexBudget } = useBudgetStore();

  const [income, setIncome] = useState<number | "">(complexBudget?.income || "");
  const [necessaryExpenses, setNecessaryExpenses] = useState<number | "">(complexBudget?.necessaryExpenses || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (income === "" || necessaryExpenses === "") return;

    try {
      await setComplexBudget(Number(income), Number(necessaryExpenses));
      toast.success(t("budgeting.updated", "Rozpočet byl úspěšně aktualizován."));
      onCancel();
    } catch (error) {
      toast.error(t("budgeting.errors.updateFailed", "Nepodařilo se upravit rozpočet."));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("budgeting.wizard.stepIncome")}
        </label>
        <TextField
          fullWidth
          size="small"
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value === "" ? "" : Number(e.target.value))}
          sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
          className="text-slate-900 dark:text-slate-200"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nutné výdaje (celkem)
        </label>
        <TextField
          fullWidth
          size="small"
          type="number"
          value={necessaryExpenses}
          onChange={(e) => setNecessaryExpenses(e.target.value === "" ? "" : Number(e.target.value))}
          sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
          className="text-slate-900 dark:text-slate-200"
          required
        />
      </div>

      <div className="flex justify-end gap-2 mt-4 border-t pt-4 border-slate-100 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors font-medium"
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          {t("common.save")}
        </button>
      </div>
    </form>
  );
}
