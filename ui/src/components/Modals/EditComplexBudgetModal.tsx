import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "../../store/budgetStore";
import { useCategoryStore } from "../../store/categoryStore";
import { TextField, IconButton, MenuItem, Select } from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import toast from "react-hot-toast";

interface EditComplexBudgetModalProps {
  onCancel: () => void;
}

export function EditComplexBudgetModal({ onCancel }: EditComplexBudgetModalProps) {
  const { t } = useTranslation();
  const { complexBudget, setComplexBudget } = useBudgetStore();
  const { categories: allCategories } = useCategoryStore();

  const [income, setIncome] = useState<number | "">(complexBudget?.income || "");
  const [necessaryExpenses, setNecessaryExpenses] = useState<number | "">(complexBudget?.necessaryExpenses || "");

  const [selectedCategories, setSelectedCategories] = useState<{ categoryId: string; limit: number }[]>(
    complexBudget?.categories?.map((c) => ({ categoryId: c.categoryId, limit: c.limit })) || []
  );

  const [newCatId, setNewCatId] = useState("");
  const [newCatLimit, setNewCatLimit] = useState<number | "">("");

  const handleAddCategory = () => {
    if (!newCatId || newCatLimit === "") return;
    if (selectedCategories.some((c) => c.categoryId === newCatId)) {
      toast.error(t("budgeting.errors.categoryAlreadyAdded"));
      return;
    }
    setSelectedCategories([
      ...selectedCategories,
      { categoryId: newCatId, limit: Number(newCatLimit) },
    ]);
    setNewCatId("");
    setNewCatLimit("");
  };

  const handleRemoveCategory = (id: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c.categoryId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (income === "" || necessaryExpenses === "") return;

    try {
      await setComplexBudget(Number(income), Number(necessaryExpenses), selectedCategories);
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
          {t("budgeting.stepNecessary")}
        </label>
        <TextField
          fullWidth
          size="small"
          type="number"
          value={necessaryExpenses}
          onChange={(e) =>
            setNecessaryExpenses(e.target.value === "" ? "" : Number(e.target.value))
          }
          sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
          className="text-slate-900 dark:text-slate-200"
          required
        />
      </div>

      <div className="mt-4 border-t pt-4 border-slate-100 dark:border-slate-700 flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("budgeting.specificCategories")}
        </label>
        
        {/* List of selected categories */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-col gap-2 mb-2">
            {selectedCategories.map((cat) => {
              const catDetails = allCategories.find((c) => c.id === cat.categoryId);
              return (
                <div key={cat.categoryId} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-800 dark:text-slate-200">
                    {catDetails?.label?.startsWith("default_categories.") ? t(catDetails.label) : (catDetails?.label || t("common.unknownCategory"))}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {cat.limit}
                    </span>
                    <IconButton size="small" color="error" onClick={() => handleRemoveCategory(cat.categoryId)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add new category */}
        <div className="flex items-start gap-2">
          <Select
            size="small"
            value={newCatId}
            onChange={(e) => setNewCatId(e.target.value)}
            displayEmpty
            className="flex-1 text-slate-900 dark:text-slate-200"
          >
            <MenuItem value="" disabled>{t("budgeting.selectCategory")}</MenuItem>
            {allCategories
              .filter((c) => !selectedCategories.some((sc) => sc.categoryId === c.id))
              .map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.label.startsWith("default_categories.") ? t(c.label) : c.label}
                </MenuItem>
              ))}
          </Select>
          
          <TextField
            size="small"
            type="number"
            placeholder="Limit"
            value={newCatLimit}
            onChange={(e) => setNewCatLimit(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-24 text-slate-900 dark:text-slate-200"
            sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
          />

          <IconButton 
            color="primary" 
            onClick={handleAddCategory}
            disabled={!newCatId || newCatLimit === ""}
            className="mt-1"
          >
            <Add />
          </IconButton>
        </div>
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
