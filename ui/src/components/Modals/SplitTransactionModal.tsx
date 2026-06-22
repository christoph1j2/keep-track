import { useState } from "react";
import { useCategoryStore } from "../../store/categoryStore";
import { Select, MenuItem, TextField } from "@mui/material";
import type { Transaction } from "../../types/transaction";
import { formatCurrency } from "../../utils/formatCurrency";
import { useTranslation } from "react-i18next"; // <-- Přidáno
import toast from "react-hot-toast";

interface SplitTransactionModalProps {
  transaction: Transaction;
  onSubmit: (
    titles: string[],
    amounts: number[],
    categoryIds: string[],
    date: string,
  ) => void;
  onCancel: () => void;
}

type SplitRow = {
  title: string;
  amount: string;
  categoryId: string;
};

/**
 * Form used to split one transaction into several smaller ones.
 * It keeps the current balance check inside the modal so the caller only receives a valid set of split rows.
 *
 * @param props.transaction Transaction being split.
 * @param props.onSubmit Called with matching title, amount, and category arrays once the split balances.
 * @param props.onCancel Called when the user leaves the split flow.
 */
export function SplitTransactionModal({
  transaction,
  onSubmit,
  onCancel,
}: SplitTransactionModalProps) {
  const categories = useCategoryStore((state) => state.categories);
  const { t } = useTranslation(); // <-- Inicializace překladů

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);

  const [splits, setSplits] = useState<SplitRow[]>([
    { title: "", amount: "", categoryId: "" },
    { title: "", amount: "", categoryId: "" },
  ]);

  // pocita s absolutnimi hodnotami, uzivatel zadava kladne castky a my aplikujeme puvodni znamenko az pri odesilani, aby bylo jednodussi kontrolovat zbylej zustatek a validovat nezaporne zadane castky
  const absoluteTransactionAmount = Math.abs(transaction.amount);
  const remaining =
    absoluteTransactionAmount -
    splits.reduce((sum, split) => {
      const val = Number(split.amount);
      return sum + (isNaN(val) ? 0 : Math.abs(val));
    }, 0);

  /**
   * Validates all split rows and submits them only when the total matches the original transaction.
   * Users enter positive values; we apply the original sign at submission.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // zabrani refreshi po odeslani formulare

    if (isSubmitting) return; // zabrani dvojitemu odeslani
    setIsSubmitting(true);
    setErrors(null);

    // validace
    const parsedAmounts = splits.map((split) => Number(split.amount));

    if (
      splits.some((split) => !split.title) ||
      splits.some((split) => split.amount === "") ||
      splits.some((split) => !split.categoryId)
    ) {
      setErrors([t("splitTransaction.errors.missingFields")]);
      setIsSubmitting(false);
      return;
    }
    if (parsedAmounts.some((a) => a === 0)) {
      setErrors([t("splitTransaction.errors.zeroAmount")]);
      setIsSubmitting(false);
      return;
    }
    if (parsedAmounts.some((a) => isNaN(a))) {
      setErrors([t("splitTransaction.errors.notANumber")]);
      setIsSubmitting(false);
      return;
    }
    if (parsedAmounts.some((a) => a < 0)) {
      setErrors([t("splitTransaction.errors.negativeAmount")]);
      setIsSubmitting(false);
      return;
    }
    if (Math.abs(remaining) > 0.005) {
      // tolerance pro floaty
      setErrors([
        t("splitTransaction.errors.amountsMismatch", {
          remaining: formatCurrency(remaining),
        }),
      ]);
      setIsSubmitting(false);
      return;
    }

    // aplikujeme puvodni znamenko k zadanym castkam, aby se odesilaly jako korektni rozdeleni (kladne i zaporne)
    const signedAmounts = parsedAmounts.map((amount) =>
      transaction.amount < 0 ? -amount : amount,
    );

    toast.success(t("splitTransaction.split")); // <-- Přidáno toastové hlášení o úspěchu
    onSubmit(
      splits.map((split) => split.title),
      signedAmounts,
      splits.map((split) => split.categoryId),
      transaction.date,
    );
  };

  return (
    <>
      <hr className="border-slate-100 dark:border-slate-800" />
      {errors && (
        <div
          className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-500/10 dark:text-red-200"
          role="alert"
          aria-live="assertive"
        >
          {errors.map((error, idx) => (
            <p key={idx}>{error}</p>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        <div className="text-slate-700 dark:text-slate-300">
          <span>
            {t("splitTransaction.info.splitTitle")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              "{transaction.title}"
            </strong>
            ,
          </span>{" "}
          <br />
          <span>
            {t("splitTransaction.info.inCategory")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              "
              {categories.find((c) => c.id === transaction.categoryId)?.label ||
                t("splitTransaction.info.unknownCategory")}
              "
            </strong>
            , <br />
          </span>
          <span>
            {t("splitTransaction.info.remaining")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {formatCurrency(remaining)}
            </strong>
          </span>
        </div>
        {/* vezme vsechny split polozky a postavi je dle indexu */}
        {splits.map((split, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:grid-cols-3 sm:items-end"
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("splitTransaction.form.titleLabel")}
              </label>
              <TextField
                size="small"
                type="text"
                placeholder={t("splitTransaction.form.titlePlaceholder")}
                value={split.title}
                onChange={(e) => {
                  const newSplits = [...splits];
                  newSplits[index].title = e.target.value;
                  setSplits(newSplits);
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("splitTransaction.form.amountLabel")}
              </label>
              <TextField
                size="small"
                type="number"
                placeholder={t("splitTransaction.form.amountPlaceholder")}
                slotProps={{ htmlInput: { step: "0.01" } }}
                value={split.amount}
                onChange={(e) => {
                  const newSplits = [...splits];
                  newSplits[index].amount = e.target.value;
                  setSplits(newSplits);
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("splitTransaction.form.categoryLabel")}
              </label>
              <Select
                size="small"
                value={split.categoryId}
                onChange={(e) => {
                  const newSplits = [...splits];
                  newSplits[index].categoryId = e.target.value;
                  setSplits(newSplits);
                }}
              >
                <MenuItem value="">
                  {t("splitTransaction.form.selectCategory")}
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>{" "}
            </div>{" "}
          </div>
        ))}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {splits.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  setSplits([
                    ...splits,
                    { title: "", amount: "", categoryId: "" },
                  ])
                }
                className="h-10 w-10 rounded-full border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-2xl leading-none transition-colors hover:bg-slate-300 dark:hover:bg-slate-800"
              >
                +
              </button>
            )}

            {splits.length > 2 && (
              <button
                type="button"
                onClick={() => setSplits(splits.slice(0, -1))}
                className="h-10 w-10 rounded-full border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-2xl leading-none transition-colors hover:bg-slate-300 dark:hover:bg-slate-800"
              >
                -
              </button>
            )}
          </div>
          {/* tlacitka */}
          <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 sm:flex-row sm:gap-3 sm:border-t-0 sm:pt-0">
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-lg px-4 py-2 font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 sm:w-auto"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto"
            >
              {t("splitTransaction.buttons.save")}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
