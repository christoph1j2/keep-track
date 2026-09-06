import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "../../store/budgetStore";
import { useCategoryStore } from "../../store/categoryStore";
import {
  TextField,
  IconButton,
  MenuItem,
  Select,
  Alert,
  AlertTitle,
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import toast from "react-hot-toast";
import { formatCurrency } from "../../utils/formatCurrency";

interface EditComplexBudgetModalProps {
  onCancel: () => void;
}

const MAX_INPUT_LENGTH = 10;

const handleNumberInput = (e: React.InputEvent<HTMLInputElement>) => {
  const target = e.currentTarget;
  if (target.value.length > MAX_INPUT_LENGTH) {
    target.value = target.value.slice(0, MAX_INPUT_LENGTH);
  }
  // Prevent infinite leading zeros (e.g. "000" -> "0", "05" -> "5")
  if (/^0[0-9]+$/.test(target.value)) {
    target.value = String(Number(target.value));
  }
};

export function EditComplexBudgetModal({
  onCancel,
}: EditComplexBudgetModalProps) {
  const { t } = useTranslation();
  const { complexBudget, setComplexBudget } = useBudgetStore();
  const { categories: allCategories } = useCategoryStore();

  const [income, setIncome] = useState<number | "">(
    complexBudget?.income ?? "",
  );

  const [selectedCategories, setSelectedCategories] = useState<
    { categoryId: string; limit: number }[]
  >(
    complexBudget?.categories?.map((c) => ({
      categoryId: c.categoryId,
      limit: c.limit,
    })) || [],
  );

  const necessaryExpenses = selectedCategories.reduce(
    (sum, cat) => sum + (Number(cat.limit) || 0),
    0,
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

  const handleUpdateCategoryLimit = (categoryId: string, limit: number) => {
    setSelectedCategories((prev) =>
      prev.map((c) => (c.categoryId === categoryId ? { ...c, limit } : c)),
    );
  };

  const handleRemoveCategory = (id: string) => {
    setSelectedCategories(
      selectedCategories.filter((c) => c.categoryId !== id),
    );
  };

  // Soft warning for when the user sets necessary expenses higher than income, but still allow saving
  const deficit = Math.max(0, necessaryExpenses - (Number(income) || 0));
  const isDeficit = income !== "" && necessaryExpenses > Number(income);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (income === "") return;

    try {
      await setComplexBudget(
        Number(income),
        Number(necessaryExpenses),
        selectedCategories,
      );
      toast.success(
        t("budgeting.updated", "Rozpočet byl úspěšně aktualizován."),
      );
      onCancel();
    } catch (error: unknown) {
      toast.error(
        t("budgeting.errors.updateFailed", "Nepodařilo se upravit rozpočet."),
      );
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Income input */}
      <div className="flex flex-col gap-1 pt-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("budgeting.wizard.stepIncome")}
        </label>
        <TextField
          fullWidth
          size="small"
          type="number"
          slotProps={{
            htmlInput: {
              min: 0,
              onInput: handleNumberInput,
            },
          }}
          value={income}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > MAX_INPUT_LENGTH) return;
            setIncome(val === "" ? "" : Math.max(0, Number(val)));
          }}
          sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
          className="text-slate-900 dark:text-slate-200 [&_.MuiOutlinedInput-notchedOutline]:border-slate-300! dark:[&_.MuiOutlinedInput-notchedOutline]:border-slate-600!"
          required
        />
      </div>
      {isDeficit && (
        <Alert
          severity="warning"
          className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50! dark:bg-amber-950/40! text-amber-900! dark:text-amber-200! [&_.MuiAlert-icon]:text-amber-600! dark:[&_.MuiAlert-icon]:text-amber-400! [&_.MuiAlertTitle-root]:text-amber-900! dark:[&_.MuiAlertTitle-root]:text-amber-100! [&_.MuiAlertTitle-root]:font-semibold"
        >
          <AlertTitle className="text-sm font-semibold">
            {t("budgeting.deficitTitle")}
          </AlertTitle>
          <span className="text-xs sm:text-sm">
            {t("budgeting.deficitMessage", {
              amount: formatCurrency(deficit),
            })}
          </span>
        </Alert>
      )}

      {/* Necessary expenses input */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("budgeting.stepNecessary")}
        </label>
        <TextField
          fullWidth
          size="small"
          type="number"
          slotProps={{ input: { readOnly: true } }}
          value={necessaryExpenses}
          sx={{
            "& .MuiInputBase-input": {
              color: "inherit",
            },
            "& .MuiInputBase-input.Mui-disabled": {
              color: "inherit",
              WebkitTextFillColor: "inherit",
              cursor: "not-allowed",
            },
          }}
          className="text-slate-900 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/50 rounded [&_.MuiOutlinedInput-notchedOutline]:border-slate-300! dark:[&_.MuiOutlinedInput-notchedOutline]:border-slate-700! [&_.MuiInputBase-input.Mui-disabled]:text-slate-900! dark:[&_.MuiInputBase-input.Mui-disabled]:text-slate-200!"
          disabled
        />
      </div>

      {/* ------------------ */}

      {/* Specific necessary categories */}
      <div className="mt-4 border-t pt-4 border-slate-100 dark:border-slate-700 flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("budgeting.specificCategories")}
        </label>

        {/* List of selected categories */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-col gap-2 mb-2">
            {selectedCategories.map((cat) => {
              const catDetails = allCategories.find(
                (c) => c.id === cat.categoryId,
              );
              return (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700"
                >
                  <span className="text-md text-slate-800 dark:text-slate-200">
                    {catDetails?.label?.startsWith("default_categories.")
                      ? t(catDetails.label)
                      : catDetails?.label || t("common.unknownCategory")}
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Editable Limit Input */}
                    {/* Dynamically sets the necessary expenses (which will NOT be editable) */}
                    <TextField
                      size="small"
                      type="number"
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          onInput: handleNumberInput,
                        },
                      }}
                      value={cat.limit}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > MAX_INPUT_LENGTH) return;
                        handleUpdateCategoryLimit(
                          cat.categoryId,
                          val === "" ? 0 : Math.max(0, Number(val)),
                        );
                      }}
                      className="w-24 text-slate-900 dark:text-slate-200 [&_.MuiOutlinedInput-notchedOutline]:border-slate-300! dark:[&_.MuiOutlinedInput-notchedOutline]:border-slate-600!"
                      sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
                    />

                    {/* Remove Category Button */}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveCategory(cat.categoryId)}
                    >
                      <Delete fontSize="medium" />
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
            className="flex-1 text-slate-900 dark:text-slate-200 [&_.MuiOutlinedInput-notchedOutline]:border-slate-300! dark:[&_.MuiOutlinedInput-notchedOutline]:border-slate-600! dark:[&_.MuiSvgIcon-root]:text-slate-400"
            MenuProps={{
              slotProps: {
                paper: {
                  className:
                    "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg",
                  sx: { maxHeight: 240 },
                },
              },
            }}
          >
            <MenuItem value="" disabled className="dark:text-slate-400">
              {t("budgeting.selectCategory")}
            </MenuItem>
            {allCategories
              .filter(
                (c) =>
                  c.type === "EXPENSE" &&
                  !selectedCategories.some((sc) => sc.categoryId === c.id),
              )
              .map((c) => (
                <MenuItem
                  key={c.id}
                  value={c.id}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  {c.label.startsWith("default_categories.")
                    ? t(c.label)
                    : c.label}
                </MenuItem>
              ))}
          </Select>

          <TextField
            size="small"
            type="number"
            slotProps={{
              htmlInput: {
                min: 0,
                onInput: handleNumberInput,
              },
            }}
            placeholder={t("budgeting.limit")}
            value={newCatLimit}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length > MAX_INPUT_LENGTH) return;
              setNewCatLimit(val === "" ? "" : Math.max(0, Number(val)));
            }}
            className="w-24 text-slate-900 dark:text-slate-200 [&_.MuiOutlinedInput-notchedOutline]:border-slate-300! dark:[&_.MuiOutlinedInput-notchedOutline]:border-slate-600!"
            sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
          />

          <IconButton
            onClick={handleAddCategory}
            disabled={!newCatId || newCatLimit === ""}
            className="mt-1 text-blue-600! dark:text-blue-400! hover:bg-blue-50 dark:hover:bg-blue-950/50"
            sx={{
              "&.Mui-disabled": {
                color: "#94a3b8 !important",
              },
              ".dark &.Mui-disabled": {
                color: "#94a3b8 !important",
              },
            }}
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
