import { useState } from "react";
import { AddBudgetModal } from "./AddBudgetModal";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "../../store/budgetStore";
import { useCategoryStore } from "../../store/categoryStore";
import {
  TextField,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Select,
  MenuItem,
} from "@mui/material";
import toast from "react-hot-toast";

interface AddBudgetWizardModalProps {
  onCancel: () => void;
}

export function AddBudgetWizardModal({ onCancel }: AddBudgetWizardModalProps) {
  const { t } = useTranslation();
  const { setComplexBudget } = useBudgetStore();
  const categories = useCategoryStore((state) => state.categories);
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const [step, setStep] = useState(0);
  const [budgetType, setBudgetType] = useState<"simple" | "complex">("simple");

  const [income, setIncome] = useState<number | "">("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<
    Record<string, number | "">
  >({});

  const baseSteps =
    budgetType === "simple"
      ? [t("budgeting.wizard.stepType"), t("budgeting.wizard.stepDetails")]
      : [
          t("budgeting.wizard.stepType"),
          t("budgeting.wizard.stepIncome"),
          t("budgeting.wizard.stepCategories"),
        ];

  const categorySteps =
    budgetType === "complex"
      ? selectedCategories.map((id) => {
          const cat = categories.find((c) => c.id === id);
          return cat
            ? cat.label.startsWith("default_categories.")
              ? t(cat.label)
              : cat.label
            : t("common.category");
        })
      : [];

  const steps =
    budgetType === "simple"
      ? baseSteps
      : [...baseSteps, ...categorySteps, t("budgeting.wizard.stepResult")];

  const necessaryExpensesSum = selectedCategories.reduce((sum, id) => {
    const val = categoryExpenses[id];
    return sum + (typeof val === "number" ? val : 0);
  }, 0);

  const handleNext = () => {
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      const formattedCategories = selectedCategories.map((categoryId) => ({
        categoryId,
        limit: Number(categoryExpenses[categoryId]) || 0,
      }));

      await setComplexBudget(Number(income), necessaryExpensesSum, formattedCategories);
      toast.success(t("budgeting.added", "Rozpočet přidán"));
      onCancel();
    } catch (e) {
      toast.error(t("budgeting.errors.addFailed", "Došlo k chybě"));
      console.error("Failed to add complex budget:", e);
    }
  };

  const setCatExpense = (id: string, val: number | "") => {
    setCategoryExpenses((prev) => ({ ...prev, [id]: val }));
  };

  const currentCategoryStepIndex = step - 3;
  const currentCategory =
    currentCategoryStepIndex >= 0 &&
    currentCategoryStepIndex < selectedCategories.length
      ? categories.find(
          (c) => c.id === selectedCategories[currentCategoryStepIndex],
        )
      : null;

  const isNextDisabled = () => {
    if (budgetType === "complex") {
      if (step === 1 && income === "") return true;
      if (currentCategory) {
        const val = categoryExpenses[currentCategory.id];
        if (val === undefined || val === "") return true;
      }
    }
    return false;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stepper activeStep={step} alternativeLabel className="mb-8">
        {steps.map((label, idx) => (
          <Step key={`${label}-${idx}`} className="mt-5">
            <StepLabel sx={{ "& .MuiStepLabel-label": { color: "inherit" } }}>
              <span className="dark:text-slate-300">{label}</span>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <div className="flex flex-col gap-4 my-4 p-1 min-h-64">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("budgeting.wizard.typeSelect")}
            </label>
            <RadioGroup
              value={budgetType}
              onChange={(e) =>
                setBudgetType(e.target.value as "simple" | "complex")
              }
              className="text-slate-800 dark:text-slate-200"
            >
              <FormControlLabel
                value="simple"
                control={
                  <Radio
                    sx={{
                      color: "gray",
                      "&.Mui-checked": { color: "#2563eb" },
                    }}
                  />
                }
                label={t("budgeting.wizard.simpleLabel")}
                className="dark:text-slate-200"
              />
              <FormControlLabel
                value="complex"
                control={
                  <Radio
                    sx={{
                      color: "gray",
                      "&.Mui-checked": { color: "#2563eb" },
                    }}
                  />
                }
                label={t("budgeting.wizard.complexLabel")}
                className="dark:text-slate-200"
              />
            </RadioGroup>
          </div>
        )}

        {step === 1 && budgetType === "simple" && (
          <div className="mt-4">
            <AddBudgetModal onCancel={onCancel} />
          </div>
        )}

        {step === 1 && budgetType === "complex" && (
          <div className="flex flex-col gap-1 mt-10 w-1/1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("budgeting.wizard.incomeLabel")}
            </label>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={income}
              onChange={(e) =>
                setIncome(e.target.value === "" ? "" : Number(e.target.value))
              }
              sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
              className="text-slate-900 dark:text-slate-200"
            />
          </div>
        )}

        {step === 2 && budgetType === "complex" && (
          <div className="flex flex-col gap-1 mt-10 w-1/1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("budgeting.wizard.categoriesLabel")}
            </label>
            <Select
              multiple
              fullWidth
              size="small"
              value={selectedCategories}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategories(
                  typeof value === "string" ? value.split(",") : value,
                );
              }}
              className="dark:text-slate-200"
              renderValue={(selected) => (
                <div className="flex flex-wrap gap-1">
                  {selected.map((val) => {
                    const c = categories.find((cat) => cat.id === val);
                    const label = c
                      ? c.label.startsWith("default_categories.")
                        ? t(c.label)
                        : c.label
                      : val;
                    return (
                      <span
                        key={val}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            >
              {expenseCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.label.startsWith("default_categories.")
                    ? t(cat.label)
                    : cat.label}
                </MenuItem>
              ))}
            </Select>
          </div>
        )}

        {budgetType === "complex" && currentCategory && (
          <div className="flex flex-col gap-1 mt-10 w-1/1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("budgeting.wizard.expenseLabel", {
                category: currentCategory.label.startsWith(
                  "default_categories.",
                )
                  ? t(currentCategory.label)
                  : currentCategory.label,
              })}
            </label>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={
                categoryExpenses[currentCategory.id] === undefined
                  ? ""
                  : categoryExpenses[currentCategory.id]
              }
              onChange={(e) =>
                setCatExpense(
                  currentCategory.id,
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
              className="text-slate-900 dark:text-slate-200"
            />
          </div>
        )}

        {budgetType === "complex" && step === steps.length - 1 && (
          <div className="flex flex-col gap-2 items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl h-full border border-slate-100 dark:border-slate-700 mt-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {t("budgeting.wizard.resultTitle")}
            </h3>
            {Number(income) < necessaryExpensesSum && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {t("budgeting.wizard.resultWarning")}
              </p>
            )}
            <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 my-2">
              {Number(income) - necessaryExpensesSum}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              {t("budgeting.wizard.resultDesc", { sum: necessaryExpensesSum })}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between gap-2 border-t pt-4 dark:border-slate-700">
        <button
          type="button"
          onClick={step === 0 ? onCancel : handleBack}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          {step === 0 ? t("common.cancel") : t("budgeting.wizard.back")}
        </button>

        {/* If simple mode and step 1, hide standard Next button (handled inside AddBudgetModal) */}
        {!(budgetType === "simple" && step === 1) && (
          <>
            {step === steps.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {t("budgeting.wizard.saveComplex")}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isNextDisabled()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {t("budgeting.wizard.next")}
              </button>
            )}
          </>
        )}
      </div>
    </Box>
  );
}
