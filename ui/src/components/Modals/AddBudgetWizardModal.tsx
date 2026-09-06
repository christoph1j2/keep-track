import { useState } from "react";
import { AddBudgetModal } from "./AddBudgetModal";
import { useTranslation } from "react-i18next";
import { useBudgetStore } from "../../store/budgetStore";
import { useCategoryStore } from "../../store/categoryStore";
import { CategoryIcon } from "../Base/CategoryIcon";
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
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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

  const steps =
    budgetType === "simple"
      ? [t("budgeting.wizard.stepType"), t("budgeting.wizard.stepDetails")]
      : [
          t("budgeting.wizard.stepType"),
          t("budgeting.wizard.stepIncome"),
          t("budgeting.wizard.stepCategories"),
          t("budgeting.wizard.stepResult"),
        ];

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

      await setComplexBudget(
        Number(income),
        necessaryExpensesSum,
        formattedCategories,
      );
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

  const isNextDisabled = () => {
    if (budgetType === "complex") {
      if (step === 1 && (income === "" || Number(income) <= 0)) return true;
      if (step === 2) {
        if (selectedCategories.length === 0) return true;
        return selectedCategories.some((id) => {
          const val = categoryExpenses[id];
          return (
            val === undefined ||
            val === "" ||
            Number(val) < 0 ||
            Number(val) == 0
          );
        });
      }
    }
    return false;
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        pt: { xs: 1, sm: 1.5 },
      }}
    >
      <Stepper activeStep={step} alternativeLabel className="pt-2 mb-6">
        {steps.map((label, idx) => (
          <Step key={`${label}-${idx}`}>
            <StepLabel sx={{ "& .MuiStepLabel-label": { color: "inherit" } }}>
              <span className="dark:text-slate-300 text-xs sm:text-sm font-medium">
                {label}
              </span>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <div className="flex-1 flex flex-col justify-between my-2 p-1 min-h-0">
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
          <div className="mt-2">
            <AddBudgetModal onCancel={onCancel} />
          </div>
        )}

        {step === 1 && budgetType === "complex" && (
          <div className="flex flex-col gap-1 mt-6 w-full">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("budgeting.wizard.incomeLabel")}
            </label>
            <TextField
              fullWidth
              size="small"
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
              value={income}
              onChange={(e) =>
                setIncome(
                  e.target.value === ""
                    ? ""
                    : Math.max(0, Number(e.target.value)),
                )
              }
              sx={{ "& .MuiInputBase-input": { color: "inherit" } }}
              className="text-slate-900 dark:text-slate-200"
            />
          </div>
        )}

        {step === 2 && budgetType === "complex" && (
          <div className="flex flex-col gap-3 mt-1 min-h-0 flex-1">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                {t("budgeting.wizard.categoriesLabel")}
              </label>
              <Select
                multiple
                fullWidth
                size="small"
                value={selectedCategories}
                onChange={(e) => {
                  const value = e.target.value;
                  const newSelected =
                    typeof value === "string" ? value.split(",") : value;
                  setSelectedCategories(newSelected);
                }}
                className="dark:text-slate-200"
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return (
                      <span className="text-slate-400">
                        {t("categories.noParent", "Select categories...")}
                      </span>
                    );
                  }
                  if (selected.length > 3) {
                    return (
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {selected.length}{" "}
                        {t("overview.categories", "Categories").toLowerCase()}
                      </span>
                    );
                  }
                  return (
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
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-200"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  );
                }}
              >
                {expenseCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        name={cat.iconName}
                        className="text-slate-500"
                      />
                      <span>
                        {cat.label.startsWith("default_categories.")
                          ? t(cat.label)
                          : cat.label}
                      </span>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </div>

            {selectedCategories.length > 0 && (
              <div className="flex flex-col gap-2 mt-1 min-h-0 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("budgeting.necessaryExpensesTitle", "Necessary Expenses")}:
                </span>
                <div className="flex flex-col gap-2 max-h-[45vh] sm:max-h-72 overflow-y-auto pr-1 flex-1 min-h-0">
                  {selectedCategories.map((catId) => {
                    const cat = categories.find((c) => c.id === catId);
                    if (!cat) return null;
                    const label = cat
                      ? cat.label.startsWith("default_categories.")
                        ? t(cat.label)
                        : cat.label
                      : catId;
                    const val = categoryExpenses[catId] ?? "";

                    return (
                      <div
                        key={catId}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-1.5 rounded-md shrink-0 ${
                              cat.colorClass || "bg-slate-200 text-slate-700"
                            }`}
                          >
                            <CategoryIcon name={cat.iconName} />
                          </div>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <TextField
                            size="small"
                            type="number"
                            placeholder="0"
                            slotProps={{ htmlInput: { min: 0 } }}
                            value={val}
                            onChange={(e) =>
                              setCatExpense(
                                catId,
                                e.target.value === ""
                                  ? ""
                                  : Math.max(0, Number(e.target.value)),
                              )
                            }
                            sx={{
                              width: "110px",
                              "& .MuiInputBase-input": {
                                textAlign: "right",
                                py: 0.75,
                              },
                            }}
                            className="dark:text-slate-200"
                          />
                          <IconButton
                            size="small"
                            onClick={() =>
                              setSelectedCategories((prev) =>
                                prev.filter((id) => id !== catId),
                              )
                            }
                            sx={{
                              color: "gray",
                              "&:hover": { color: "#ef4444" },
                            }}
                            title={t("common.delete", "Remove")}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 mt-auto">
                  <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                    {t("budgeting.necessaryExpensesTitle", "Total")}:
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {necessaryExpensesSum.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {budgetType === "complex" && step === 3 && (
          <div className="flex-1 flex flex-col justify-between gap-3 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 min-h-0">
            <div className="flex flex-col items-center">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 text-center">
                {t("budgeting.wizard.resultTitle")}
              </h3>
              {Number(income) < necessaryExpensesSum && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium mt-1">
                  {t("budgeting.wizard.resultWarning")}
                </p>
              )}
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 text-center my-1.5">
                {(Number(income) - necessaryExpensesSum).toLocaleString()}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
                {t("budgeting.wizard.resultDesc", {
                  sum: necessaryExpensesSum.toLocaleString(),
                })}
              </p>
            </div>

            <div className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-3 flex-1 overflow-y-auto max-h-[50vh] sm:max-h-72 pr-1 flex flex-col gap-2 min-h-0">
              <div className="flex justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span>{t("budgeting.wizard.stepIncome", "Income")}</span>
                <span className="text-green-600 dark:text-green-400 font-bold">
                  +{Number(income).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span>
                  {t("budgeting.necessaryExpensesTitle", "Necessary Expenses")}
                </span>
                <span className="text-red-500 dark:text-red-400 font-bold">
                  -{necessaryExpensesSum.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-slate-200/60 dark:border-slate-700/60 my-1"></div>
              {selectedCategories.map((catId) => {
                const cat = categories.find((c) => c.id === catId);
                const label = cat
                  ? cat.label.startsWith("default_categories.")
                    ? t(cat.label)
                    : cat.label
                  : catId;
                const limit = Number(categoryExpenses[catId]) || 0;
                return (
                  <div
                    key={catId}
                    className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300 py-1 px-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/40"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`p-1 rounded shrink-0 ${
                          cat?.colorClass || "bg-slate-200 text-slate-700"
                        }`}
                      >
                        <CategoryIcon
                          name={cat?.iconName || ""}
                          className="w-3.5 h-3.5"
                        />
                      </div>
                      <span className="truncate">{label}</span>
                    </div>
                    <span className="font-semibold shrink-0 ml-2">
                      {limit.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 flex justify-between gap-2 border-t dark:border-slate-700">
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
